'use strict';

const DEFAULT_LABELS = [
  'EatingHungry',
  'EatingFeelFull',
  'EatingNeutral',
  'NotEatingHungry',
  'NotEatingNeutral',
  'NotEatingSatiety',
  'Walking',
  'Standing',
  'Sitting',
  'Video Gaming',
  'Watching TV',
  'Lying',
];

const KEY = {
  LABELS: 'iOSLabelApp.labels',
  CSV:    'iOSLabelApp.csv',
  LAST:   'iOSLabelApp.last',
};

const state = {
  labels: loadLabels(),
  lastLabel: localStorage.getItem(KEY.LAST) || null,
  editing: false,
};

function loadLabels() {
  const raw = localStorage.getItem(KEY.LABELS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(s => typeof s === 'string')) return parsed;
    } catch (_) {}
  }
  return [...DEFAULT_LABELS];
}

function saveLabels() {
  localStorage.setItem(KEY.LABELS, JSON.stringify(state.labels));
}

function getCsv() {
  return localStorage.getItem(KEY.CSV) || '';
}

function appendCsvRow(ts, label) {
  const existing = getCsv();
  const header = existing ? '' : 'timestamp,label\n';
  const escaped = /[",\n\r]/.test(label) ? `"${label.replace(/"/g, '""')}"` : label;
  localStorage.setItem(KEY.CSV, existing + header + ts + ',' + escaped + '\n');
}

function rowCount() {
  const csv = getCsv();
  if (!csv) return 0;
  const lines = csv.split('\n');
  // header + final empty line after last \n
  return Math.max(0, lines.length - 2);
}

function timestamp() {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-` +
         `${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}.` +
         `${p(d.getMilliseconds(), 3)}`;
}

function fileTimestamp() {
  return timestamp().replace('.', '-');
}

function render() {
  renderLabels();
  renderLast();
  renderStats();
  document.getElementById('editBtn').textContent = state.editing ? 'Done' : 'Edit';
}

function renderLabels() {
  const grid = document.getElementById('labelsGrid');
  grid.innerHTML = '';
  state.labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.className = 'label-btn' + (state.editing ? ' editing' : '');
    btn.type = 'button';

    const text = document.createElement('span');
    text.textContent = label;
    btn.appendChild(text);

    if (state.editing) {
      const actions = document.createElement('div');
      actions.className = 'edit-actions';

      const editIcon = document.createElement('button');
      editIcon.type = 'button';
      editIcon.className = 'icon-btn';
      editIcon.textContent = '✎';
      editIcon.setAttribute('aria-label', 'Edit ' + label);
      editIcon.addEventListener('click', e => { e.stopPropagation(); promptEdit(i); });

      const delIcon = document.createElement('button');
      delIcon.type = 'button';
      delIcon.className = 'icon-btn delete';
      delIcon.textContent = '×';
      delIcon.setAttribute('aria-label', 'Delete ' + label);
      delIcon.addEventListener('click', e => { e.stopPropagation(); deleteLabel(i); });

      actions.appendChild(editIcon);
      actions.appendChild(delIcon);
      btn.appendChild(actions);

      btn.addEventListener('click', () => promptEdit(i));
    } else {
      btn.addEventListener('click', () => onLabelTap(label, btn));
    }

    grid.appendChild(btn);
  });
}

function renderLast() {
  document.getElementById('lastLabel').textContent = state.lastLabel || '—';
}

function renderStats() {
  document.getElementById('stats').textContent = `${rowCount()} entries logged`;
}

function tickClock() {
  document.getElementById('time').textContent = timestamp();
}

function onLabelTap(label, btn) {
  const ts = timestamp();
  try {
    appendCsvRow(ts, label);
  } catch (e) {
    showToast('Storage full — export & erase the log');
    return;
  }
  state.lastLabel = label;
  localStorage.setItem(KEY.LAST, label);
  renderLast();
  renderStats();

  btn.classList.add('flash');
  setTimeout(() => btn.classList.remove('flash'), 220);

  if (navigator.vibrate) navigator.vibrate(8);
  showToast('+ ' + label);
}

function promptAdd() {
  const modal = document.getElementById('addModal');
  const input = document.getElementById('newLabelInput');
  input.value = '';
  modal.showModal();
  setTimeout(() => input.focus(), 50);

  modal.addEventListener('close', function handler() {
    modal.removeEventListener('close', handler);
    if (modal.returnValue !== 'confirm') return;
    const v = input.value.trim();
    if (!v) return;
    if (state.labels.includes(v)) { showToast('Label already exists'); return; }
    state.labels.push(v);
    saveLabels();
    renderLabels();
  });
}

function promptEdit(index) {
  const modal = document.getElementById('editModal');
  const input = document.getElementById('editLabelInput');
  input.value = state.labels[index];
  modal.showModal();
  setTimeout(() => { input.focus(); input.select(); }, 50);

  modal.addEventListener('close', function handler() {
    modal.removeEventListener('close', handler);
    if (modal.returnValue !== 'confirm') return;
    const v = input.value.trim();
    if (!v) return;
    if (v === state.labels[index]) return;
    if (state.labels.includes(v)) { showToast('Label already exists'); return; }
    state.labels[index] = v;
    saveLabels();
    renderLabels();
  });
}

function deleteLabel(index) {
  const name = state.labels[index];
  confirmAction('Delete label?', `Remove "${name}"? Existing log entries are kept.`, () => {
    state.labels.splice(index, 1);
    saveLabels();
    renderLabels();
  });
}

function confirmAction(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  modal.showModal();
  modal.addEventListener('close', function handler() {
    modal.removeEventListener('close', handler);
    if (modal.returnValue === 'confirm') onConfirm();
  });
}

function exportCsv() {
  const csv = getCsv();
  if (!csv) { showToast('Nothing to export'); return; }
  const filename = `activity-log-${fileTimestamp()}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const file = new File([blob], filename, { type: 'text/csv' });

  // Prefer the iOS share sheet (Files, AirDrop, Mail, etc.)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Activity log' })
      .catch(err => { if (err && err.name !== 'AbortError') downloadBlob(blob, filename); });
    return;
  }
  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function eraseLog() {
  const n = rowCount();
  if (n === 0) { showToast('Log already empty'); return; }
  confirmAction('Erase log?',
    `Delete all ${n} logged entries? Labels are kept. This cannot be undone.`,
    () => {
      localStorage.removeItem(KEY.CSV);
      state.lastLabel = null;
      localStorage.removeItem(KEY.LAST);
      render();
      showToast('Log erased');
    });
}

function resetLabels() {
  confirmAction('Reset labels?',
    'Restore the default label list. Custom labels are removed; the log is kept.',
    () => {
      state.labels = [...DEFAULT_LABELS];
      saveLabels();
      renderLabels();
      showToast('Labels reset');
    });
}

function toggleEdit() {
  state.editing = !state.editing;
  render();
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1300);
}

document.getElementById('addBtn').addEventListener('click', promptAdd);
document.getElementById('editBtn').addEventListener('click', toggleEdit);
document.getElementById('exportBtn').addEventListener('click', exportCsv);
document.getElementById('eraseBtn').addEventListener('click', eraseLog);
document.getElementById('resetBtn').addEventListener('click', resetLabels);

render();
tickClock();
setInterval(tickClock, 50);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed:', err));
  });
}

document.addEventListener('gesturestart', e => e.preventDefault());

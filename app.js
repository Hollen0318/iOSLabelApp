'use strict';

const CATEGORY_ORDER = ['Posture', 'Ingestion', 'Fullness', 'Other'];

const DEFAULT_CATEGORIES = {
  Posture:   ['Standing', 'Sitting', 'Walking', 'Lying', 'Crouching', 'Running', 'Jumping'],
  Ingestion: ['Eating', 'NotEating'],
  Fullness:  ['Hungry', 'Neutral', 'Satiety'],
  Other:     [],
};

const KEY = {
  CATS: 'iOSLabelApp.categories',
  SEL:  'iOSLabelApp.selection',
  CSV:  'iOSLabelApp.csv',
};

const CSV_HEADER = 'timestamp,' + CATEGORY_ORDER.join(',') + '\n';
const NONE = '-1';

const state = {
  categories: loadCategories(),
  selection:  loadSelection(),
  editing:    false,
};

function cloneDefaults() {
  const out = {};
  for (const k of CATEGORY_ORDER) out[k] = [...DEFAULT_CATEGORIES[k]];
  return out;
}

function emptySelection() {
  const out = {};
  for (const k of CATEGORY_ORDER) out[k] = null;
  return out;
}

function loadCategories() {
  const raw = localStorage.getItem(KEY.CATS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' &&
          CATEGORY_ORDER.every(k => Array.isArray(parsed[k]) && parsed[k].every(s => typeof s === 'string'))) {
        const out = {};
        for (const k of CATEGORY_ORDER) out[k] = [...parsed[k]];
        return out;
      }
    } catch (_) {}
  }
  return cloneDefaults();
}

function saveCategories() {
  localStorage.setItem(KEY.CATS, JSON.stringify(state.categories));
}

function loadSelection() {
  const raw = localStorage.getItem(KEY.SEL);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const out = {};
        for (const k of CATEGORY_ORDER) {
          const v = parsed[k];
          out[k] = (typeof v === 'string' && v.length > 0) ? v : null;
        }
        return out;
      }
    } catch (_) {}
  }
  return emptySelection();
}

function saveSelection() {
  localStorage.setItem(KEY.SEL, JSON.stringify(state.selection));
}

function getCsv() {
  return localStorage.getItem(KEY.CSV) || '';
}

function ensureCsvSchema() {
  // Old single-column CSV (`timestamp,label`) is incompatible with the new four-column layout.
  const csv = getCsv();
  if (!csv) return;
  if (!csv.startsWith(CSV_HEADER)) {
    localStorage.removeItem(KEY.CSV);
    showToast('Old log cleared — schema changed');
  }
}

function csvCell(v) {
  if (v == null) return NONE;
  if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

function appendCsvRow(ts, sel) {
  const existing = getCsv();
  const head = existing ? '' : CSV_HEADER;
  const cells = CATEGORY_ORDER.map(k => csvCell(sel[k]));
  localStorage.setItem(KEY.CSV, existing + head + ts + ',' + cells.join(',') + '\n');
}

function rowCount() {
  const csv = getCsv();
  if (!csv) return 0;
  const lines = csv.split('\n');
  return Math.max(0, lines.length - 2); // header + trailing newline
}

function timestamp() {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' +
         p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds()) + '.' +
         p(d.getMilliseconds(), 3);
}

function fileTimestamp() {
  return timestamp().replace('.', '-');
}

function render() {
  renderCategories();
  renderState();
  renderStats();
  document.getElementById('editBtn').textContent = state.editing ? 'Done' : 'Edit';
}

function renderCategories() {
  const root = document.getElementById('categoriesRoot');
  root.innerHTML = '';

  for (const cat of CATEGORY_ORDER) {
    const section = document.createElement('section');
    section.className = 'category';

    const h = document.createElement('h2');
    h.className = 'category-title';
    h.textContent = cat;
    section.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'labels-grid';

    state.categories[cat].forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSel = state.selection[cat] === label;
      btn.className = 'label-btn' +
        (state.editing ? ' editing' : '') +
        (isSel ? ' selected' : '');

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
        editIcon.addEventListener('click', e => { e.stopPropagation(); promptEdit(cat, i); });

        const delIcon = document.createElement('button');
        delIcon.type = 'button';
        delIcon.className = 'icon-btn delete';
        delIcon.textContent = '×';
        delIcon.setAttribute('aria-label', 'Delete ' + label);
        delIcon.addEventListener('click', e => { e.stopPropagation(); deleteLabel(cat, i); });

        actions.appendChild(editIcon);
        actions.appendChild(delIcon);
        btn.appendChild(actions);

        btn.addEventListener('click', () => promptEdit(cat, i));
      } else {
        btn.addEventListener('click', () => onLabelTap(cat, label, btn));
      }

      grid.appendChild(btn);
    });

    if (state.editing) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'label-btn add-btn';
      const addText = document.createElement('span');
      addText.textContent = '+ Add';
      addBtn.appendChild(addText);
      addBtn.addEventListener('click', () => promptAdd(cat));
      grid.appendChild(addBtn);
    } else if (state.categories[cat].length === 0) {
      const hint = document.createElement('div');
      hint.className = 'empty-hint';
      hint.textContent = 'Tap Edit to add labels';
      grid.appendChild(hint);
    }

    section.appendChild(grid);
    root.appendChild(section);
  }
}

function renderState() {
  const el = document.getElementById('stateRow');
  el.innerHTML = '';
  for (const cat of CATEGORY_ORDER) {
    const v = state.selection[cat];
    const chip = document.createElement('div');
    chip.className = 'chip' + (v ? ' chip-set' : '');

    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = cat;

    const val = document.createElement('span');
    val.className = 'chip-val';
    val.textContent = v == null ? '—' : v;

    chip.appendChild(name);
    chip.appendChild(val);
    el.appendChild(chip);
  }
}

function renderStats() {
  document.getElementById('stats').textContent = rowCount() + ' entries logged';
}

function tickClock() {
  document.getElementById('time').textContent = timestamp();
}

function onLabelTap(cat, label, btn) {
  const previous = state.selection[cat];
  const next = (previous === label) ? null : label;
  state.selection[cat] = next;

  const ts = timestamp();
  try {
    appendCsvRow(ts, state.selection);
  } catch (e) {
    state.selection[cat] = previous;
    showToast('Storage full — export & erase the log');
    return;
  }

  saveSelection();
  renderCategories();
  renderState();
  renderStats();

  btn.classList.add('flash');
  setTimeout(() => btn.classList.remove('flash'), 220);

  if (navigator.vibrate) navigator.vibrate(8);
  showToast(next ? cat + ': ' + label : cat + ' cleared');
}

function promptAdd(cat) {
  const modal = document.getElementById('addModal');
  const input = document.getElementById('newLabelInput');
  document.getElementById('addModalTitle').textContent = 'New ' + cat + ' label';
  input.value = '';
  modal.showModal();
  setTimeout(() => input.focus(), 50);

  modal.addEventListener('close', function handler() {
    modal.removeEventListener('close', handler);
    if (modal.returnValue !== 'confirm') return;
    const v = input.value.trim();
    if (!v) return;
    if (state.categories[cat].includes(v)) { showToast('Already exists in ' + cat); return; }
    state.categories[cat].push(v);
    saveCategories();
    renderCategories();
  });
}

function promptEdit(cat, index) {
  const modal = document.getElementById('editModal');
  const input = document.getElementById('editLabelInput');
  const oldName = state.categories[cat][index];
  document.getElementById('editModalTitle').textContent = 'Edit ' + cat + ' label';
  input.value = oldName;
  modal.showModal();
  setTimeout(() => { input.focus(); input.select(); }, 50);

  modal.addEventListener('close', function handler() {
    modal.removeEventListener('close', handler);
    if (modal.returnValue !== 'confirm') return;
    const v = input.value.trim();
    if (!v) return;
    if (v === oldName) return;
    if (state.categories[cat].includes(v)) { showToast('Already exists in ' + cat); return; }
    state.categories[cat][index] = v;
    if (state.selection[cat] === oldName) {
      state.selection[cat] = v;
      saveSelection();
    }
    saveCategories();
    renderCategories();
    renderState();
  });
}

function deleteLabel(cat, index) {
  const name = state.categories[cat][index];
  confirmAction('Delete label?', 'Remove "' + name + '" from ' + cat + '? Existing log entries are kept.', () => {
    state.categories[cat].splice(index, 1);
    if (state.selection[cat] === name) {
      state.selection[cat] = null;
      saveSelection();
    }
    saveCategories();
    renderCategories();
    renderState();
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
  const filename = 'activity-log-' + fileTimestamp() + '.csv';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const file = new File([blob], filename, { type: 'text/csv' });

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
    'Delete all ' + n + ' logged entries? Labels and current selections are kept. This cannot be undone.',
    () => {
      localStorage.removeItem(KEY.CSV);
      render();
      showToast('Log erased');
    });
}

function resetLabels() {
  confirmAction('Reset labels?',
    'Restore the default category labels. Custom labels are removed; the log is kept; selections that referenced removed labels are cleared.',
    () => {
      state.categories = cloneDefaults();
      for (const k of CATEGORY_ORDER) {
        if (state.selection[k] && !state.categories[k].includes(state.selection[k])) {
          state.selection[k] = null;
        }
      }
      saveCategories();
      saveSelection();
      render();
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

document.getElementById('editBtn').addEventListener('click', toggleEdit);
document.getElementById('exportBtn').addEventListener('click', exportCsv);
document.getElementById('eraseBtn').addEventListener('click', eraseLog);
document.getElementById('resetBtn').addEventListener('click', resetLabels);

ensureCsvSchema();
render();
tickClock();
setInterval(tickClock, 50);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed:', err));
  });
}

document.addEventListener('gesturestart', e => e.preventDefault());

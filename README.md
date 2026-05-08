# Activity Logger

A tap-to-log activity tracker that runs as a Progressive Web App on iPhone. The screen is split into four label categories — **Posture**, **Ingestion**, **Fullness**, **Other** — and each tap appends a millisecond-precision row capturing the full state across all four categories. No App Store, no developer account, no recurring fees.

After deploy, your app lives at `https://YOUR-USERNAME.github.io/iOSLabelApp/`.

## Features

- Four orthogonal label categories with one selection each (tap to set, tap again to clear)
- Default labels per category; create / rename / delete your own within any category
- Live clock in `YYYY-MM-DD-HH-MM-SS.mmm` format and four state chips showing the current selections
- One-tap CSV export through the iOS share sheet (save to Files, AirDrop, email, etc.)
- Two reset buttons: erase the log (keeps labels) and reset labels (keeps the log)
- Works offline — installs as a home-screen app via service worker
- Data persists across app restarts and device reboots (browser `localStorage`)

## Deploy on GitHub Pages (free)

1. Create a GitHub account at <https://github.com/signup> if you don't already have one.
2. Create a new **public** repo named `iOSLabelApp` (any public name works — adjust the URL below if you change it). Don't initialize with a README — you'll be replacing the contents.
3. Upload every file in this folder to the repo:
   - Easiest path: open the new empty repo on github.com, click **Add file → Upload files**, drag all files (including `icon-*.png`, `icon.svg`, `manifest.json`, `sw.js`, `index.html`, `style.css`, `app.js`, `README.md`), then **Commit changes**.
4. In the repo, go to **Settings → Pages**.
5. Under **Source**, choose `Deploy from a branch`, select `main` branch and `/ (root)`. Save.
6. Wait ~30–60 seconds. The site will be live at `https://YOUR-USERNAME.github.io/iOSLabelApp/`.

## Install on iPhone

1. Open the URL above in **Safari** (Chrome and Firefox on iOS can't add PWAs to the home screen).
2. Tap the **Share** icon (square with arrow at the bottom).
3. Scroll and tap **Add to Home Screen**.
4. Open the new icon from the home screen — it runs full-screen, works offline, and stores data on-device.

## Usage

- **Tap a label** in any category → that category's selection becomes that label and a CSV row is appended.
- **Tap the currently-selected label again** → its category becomes empty (`-1` in that column) and a CSV row is appended.
- **Edit** → enters edit mode; each category gains a `+ Add` tile; tap any label to rename, or tap the red `×` to delete.
- **Export CSV** → opens the iOS share sheet so you can save to Files, AirDrop to your Mac, attach to email, etc.
- **Erase log** → clears the timestamp log; labels and current selections are kept. Confirmation required.
- **Reset labels** → restores the default category labels; the log is kept; selections that referenced removed labels are cleared. Confirmation required.

## Default labels

| Category    | Labels                                                       |
|-------------|--------------------------------------------------------------|
| Posture     | Standing, Sitting, Walking, Lying, Crouching, Running, Jumping |
| Ingestion   | Eating, NotEating                                            |
| Fullness    | Hungry, Neutral, Satiety                                     |
| Other       | (empty — add your own)                                       |

## CSV format

One combined file with a header row. Empty categories are written as `-1`.

```
timestamp,Posture,Ingestion,Fullness,Other
2026-05-08-14-23-45.123,Sitting,-1,-1,-1
2026-05-08-14-23-58.401,Sitting,Eating,-1,-1
2026-05-08-14-31-08.802,Sitting,Eating,Neutral,-1
```

Loads cleanly in pandas:

```python
import pandas as pd
df = pd.read_csv('activity-log-...csv')
df['timestamp'] = pd.to_datetime(df['timestamp'], format='%Y-%m-%d-%H-%M-%S.%f')
# Replace -1 sentinels with NaN per category column if you prefer:
for c in ['Posture', 'Ingestion', 'Fullness', 'Other']:
    df[c] = df[c].replace('-1', pd.NA)
```

## Storage notes

Data lives in the browser's `localStorage`, which has a per-origin limit of about 5–10 MB (roughly 100,000+ four-column rows at typical label lengths). The app caps the cost via short labels and short timestamps, so this is plenty for typical use, but **export regularly** — iOS can clear site data in low-storage situations or after long inactivity if the app isn't on the home screen.

If you previously installed an older single-column version of this app, the old `timestamp,label` log is auto-cleared on first launch with a toast message. The two CSV schemas are not interconvertible — export the old log first if you want to preserve it.

## File overview

| File | Purpose |
|------|---------|
| `index.html` | Single-page UI |
| `style.css` | Dark theme, mobile-first layout |
| `app.js` | Categories, selections, tap-to-log, CSV, edit mode, export |
| `manifest.json` | PWA manifest (name, icons, display mode) |
| `sw.js` | Service worker — caches assets for offline use |
| `icon.svg` | Source icon |
| `icon-180.png` | iOS home-screen icon (apple-touch-icon) |
| `icon-192.png` `icon-512.png` | PWA manifest icons |

No build step. No dependencies. Open `index.html` directly to develop locally, or run `python3 -m http.server` in this folder and visit <http://localhost:8000>.

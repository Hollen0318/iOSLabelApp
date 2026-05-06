# Activity Logger

A tap-to-log activity tracker that runs as a Progressive Web App on iPhone. Each tap appends a millisecond-precision row to a local CSV. No App Store, no developer account, no recurring fees.

After deploy, your app lives at `https://YOUR-USERNAME.github.io/iOSLabelApp/`.

## Features

- 12 default labels; create / rename / delete your own
- Live clock in `YYYY-MM-DD-HH-MM-SS.mmm` format
- Always shows the last-tapped label ("last state")
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

- **Tap a label** → appends `timestamp,label` to the local CSV.
- **Edit** → enters edit mode; tap a label to rename, or tap the red `×` to delete.
- **+ Add label** → creates a new label.
- **Export CSV** → opens the iOS share sheet so you can save to Files, AirDrop to your Mac, attach to email, etc.
- **Erase log** → clears the timestamp log; labels are kept. Confirmation required.
- **Reset labels** → restores the default label list; the log is kept. Confirmation required.

## CSV format

One combined file with a header row:

```
timestamp,label
2026-05-06-14-23-45.123,Walking
2026-05-06-14-31-08.802,Sitting
```

Loads cleanly in pandas:

```python
import pandas as pd
df = pd.read_csv('activity-log-...csv')
df['timestamp'] = pd.to_datetime(df['timestamp'], format='%Y-%m-%d-%H-%M-%S.%f')
```

## Defaults applied

- **CSV layout:** combined `timestamp,label` (recommended in the spec).
- **Spelling:** `NotEatingSatiety` (the spec's `NotEaingSatiety` looks like a typo).
- **`Lying`:** lying down (rest activity).

If any of those should be different, change `DEFAULT_LABELS` near the top of `app.js`.

## Storage notes

Data lives in the browser's `localStorage`, which has a per-origin limit of about 5–10 MB (around 200,000+ rows). The app caps the cost via short labels and short timestamps, so this is plenty for typical use, but **export regularly** — iOS can clear site data in low-storage situations or after long inactivity if the app isn't on the home screen.

## File overview

| File | Purpose |
|------|---------|
| `index.html` | Single-page UI |
| `style.css` | Dark theme, mobile-first layout |
| `app.js` | Labels, tap-to-log, CSV, edit mode, export |
| `manifest.json` | PWA manifest (name, icons, display mode) |
| `sw.js` | Service worker — caches assets for offline use |
| `icon.svg` | Source icon |
| `icon-180.png` | iOS home-screen icon (apple-touch-icon) |
| `icon-192.png` `icon-512.png` | PWA manifest icons |

No build step. No dependencies. Open `index.html` directly to develop locally, or run `python3 -m http.server` in this folder and visit <http://localhost:8000>.

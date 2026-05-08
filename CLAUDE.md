# iOSLabelApp

Personal iOS app for activity labeling on iPhone 15. The app exposes four orthogonal label categories; selecting (or unselecting) any label appends a timestamped row to a local CSV. Used for behavioral/activity tracking with millisecond-precision timestamps.

## Implementation path

**Confirmed: Progressive Web App (PWA).** Hosted on GitHub Pages, installed via iPhone Safari "Add to Home Screen". Storage is `localStorage`; export is a `Blob` through the iOS share sheet; offline support via service worker.

## Categories and labels

The screen is divided into four sections, one per category. Each category holds an independent selection — at any moment a category is either set to one of its labels or empty.

| Category    | CSV column   | Default labels                                             |
|-------------|--------------|------------------------------------------------------------|
| Posture     | `Posture`    | Standing, Sitting, Walking, Lying, Crouching, Running, Jumping |
| Ingestion   | `Ingestion`  | Eating, NotEating                                          |
| Fullness    | `Fullness`   | Hungry, Neutral, Satiety                                   |
| Other       | `Other`      | (empty — user adds custom states here)                     |

Notes:
- `Lying` = lying down (rest activity), not "telling lies".
- `Crouching` is the canonical spelling (the original spec had `Crounching`).
- Labels can be added, renamed, and deleted within any category. The "Reset labels" button restores all four categories to the table above.

## Selection and logging behavior

- **Tap an unselected label** → it becomes the active selection in its category, replacing any previous selection in that category. Append a CSV row reflecting the new full state.
- **Tap an already-selected label** → its category becomes empty. Append a CSV row reflecting the new full state (with `-1` in that column).
- **CSV row** → `timestamp,Posture,Ingestion,Fullness,Other`. Empty categories are written as the literal `-1`.
- **Timestamp format** — `YYYY-MM-DD-HH-MM-SS.mmm` (3-digit milliseconds). Python equivalent: `datetime.now().strftime('%Y-%m-%d-%H-%M-%S.%f')[:-3]`
- **Live header** — shows the current timestamp (updating live) and the four current selections (or `—` for empty categories).
- **Persistence** — labels, current selections, and the CSV all survive app restart and device reboot.

## Other UI requirements

- **Edit mode** — toggles label-management affordances on every category: a `+ Add` tile per section and edit/delete icons on each label.
- **Export** — exports the CSV to the iOS share sheet (Files, AirDrop, mail, etc.).
- **Erase log** — clears the CSV, keeps labels and current selections.
- **Reset labels** — restores the default category labels; CSV is kept; selections that referenced removed labels are cleared.

## CSV example

```
timestamp,Posture,Ingestion,Fullness,Other
2026-05-08-14-23-45.123,Sitting,-1,-1,-1
2026-05-08-14-23-58.401,Sitting,Eating,-1,-1
2026-05-08-14-31-08.802,Sitting,Eating,Neutral,-1
2026-05-08-14-45-12.099,Sitting,-1,Neutral,-1
```

Loads into pandas with the `-1` sentinel intact:

```python
import pandas as pd
df = pd.read_csv('activity-log-...csv')
df['timestamp'] = pd.to_datetime(df['timestamp'], format='%Y-%m-%d-%H-%M-%S.%f')
# Replace -1 with NaN per category column if you want pandas-native missing values:
for c in ['Posture', 'Ingestion', 'Fullness', 'Other']:
    df[c] = df[c].replace('-1', pd.NA)
```

## Schema migrations

Old `timestamp,label` CSVs (the pre-category single-column format) are auto-cleared on first load with a toast message. There is no auto-conversion — the two schemas are not isomorphic.

## Target device

iPhone 15 (iOS 17 or 18).

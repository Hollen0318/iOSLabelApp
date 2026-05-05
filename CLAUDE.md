# iOSLabelApp

Personal iOS app for activity labeling on iPhone 15. Tapping a label appends a timestamped row to a local CSV. Used for behavioral/activity tracking with millisecond-precision timestamps.

## Implementation path

**Recommended: Progressive Web App (PWA)** — no XCode required.
- Host on GitHub Pages (free) or Netlify
- iPhone Safari → Add to Home Screen
- Storage: localStorage or IndexedDB
- CSV export: Blob download → Files app
- Offline support via service worker

**Alternatives** if PWA is rejected:
- **Native iOS (XCode + SwiftUI)** — most durable storage; requires Apple Developer account ($99/yr) for permanent install, or free Apple ID with weekly re-signing
- **Pythonista 3** (~$10 App Store) — runs Python on-device with a Pythonista-specific `ui` module (code is not portable Python)

User has not yet confirmed the path. Confirm before implementing.

## Requirements

Single-screen interface providing:

- **Label management** — create new label (text input), edit existing labels, delete individual labels
- **Tap-to-log** — tapping any label appends one row to the internal CSV with the current timestamp
- **Timestamp format** — `YYYY-MM-DD-HH-MM-SS.mmm` (3-digit milliseconds). Python equivalent: `datetime.now().strftime('%Y-%m-%d-%H-%M-%S.%f')[:-3]`
- **Live display** — always show (a) the last-tapped label ("last state") and (b) the current time formatted as above, updating live
- **Export** — export CSV to the Files app / Downloads / share sheet
- **Reset operations** (two separate buttons):
  - *Delete all labels* — removes custom labels and resets to the default list
  - *Erase CSV* — clears the timestamp log, keeps labels intact
- **Persistence** — data must survive app restart and device reboot

## Default labels

EatingHungry, EatingFeelFull, EatingNeutral, NotEatingHungry, NotEatingNeutral, NotEatingSatiety, Walking, Standing, Sitting, Video Gaming, Watching TV, Lying

## Open questions (resolve before building)

1. **CSV layout** — one combined CSV with columns `timestamp,label` (recommended — easier to analyze in pandas), or one CSV per label containing only timestamps?
2. **Spelling** — original spec had `NotEaingSatiety`; assume `NotEatingSatiety`?
3. **Word sense** — `Lying` = lying down (rest activity), not "telling lies"?

## Target device

iPhone 15 (iOS 17 or 18).

## Repo state

Fresh repo, initial commit only — no implementation yet.

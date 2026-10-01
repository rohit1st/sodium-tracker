# a little less 🍊

A mobile-first, local-first sodium tracker in the approved tangerine and butter palette. Built with browser-native HTML, CSS and JavaScript; no npm dependencies or paid voice service.

## Run

Node 20 or later:

```sh
npm run dev
```

Open http://127.0.0.1:4173. For the production PWA:

```sh
npm test
npm run build
npm run preview
```

Open http://127.0.0.1:4174. Do not open index.html as a file: modules and service workers need HTTP or HTTPS.

## What works

- Daily goal, local calendar dates, meal totals, remaining allowance and editable entries with Undo.
- Package label arithmetic, fractions and whole-container multipliers.
- Cooking drafts, cumulative ingredient sodium, saved batches, fractional portions and leftovers across days. Saving a batch does not log it as eaten.
- Native phone keyboard dictation into Describe. A deterministic parser extracts label amounts and portions, then asks the user to review them. It does not call Siri directly or use a transcription subscription.
- A small offline set of editable restaurant references, custom nutrition entry, and dinner ideas sorted by available allowance. Planned meals are distinct from eaten meals.
- Calendar stickers distinguish incomplete logs, completed within-limit days and completed over-limit days. Historical goals are preserved.
- Settings: home-screen installation help, native sharing/copy link, refresh, confirmed reset, JSON backup export/import, light/dark/system appearance.
- Install manifest, icons, supported home-screen shortcuts and a versioned service worker for offline use after the first online visit.

## Install and share on a phone

Publish the contents of `dist/` to an HTTPS static host **at the root of its own origin**. No server, database, environment variables or API keys are required. The manifest and service worker use root paths. Do not deploy under a subfolder without updating those paths.

On iPhone, open the HTTPS URL in Safari and use Share → Add to Home Screen. On Android, use the app's installation control where supported, or the browser's Install/Add to Home Screen menu. Long-press app shortcuts depend on the browser and OS. The app includes platform instructions in Settings.

The current localhost preview runs only on this computer; it is not a public sharing link. The app intentionally explains this when Share is used locally. An HTTPS deployment is still required for normal phone installation and family sharing.

## Data and limitations

Food logs stay in this browser's localStorage. No account, analytics or automatic sync. Export a backup before clearing browser data, changing devices or moving to a different hosting origin. Imported backups replace the current log after confirmation. Cooking drafts persist locally but are excluded when restoring imported backups.

Restaurant coverage is deliberately limited: two editable chicken bowl/burrito references based on the linked July 2022 Chipotle component sheet, plus manual entry for other dishes. There is no arbitrary restaurant search, live nutrition feed, barcode scanning or AI nutrition lookup. References and dinner ranges are estimates; users must review portions, current menus, labels and added sauces or salt. Dinner suggestions cannot guarantee a sodium outcome. The daily goal is user-controlled.

The default collapsed Today screen fits phone viewports. Expanded food details, forms, recipes and settings scroll as needed. No fake phone status bar is included; the layout accommodates device safe areas and larger text.

## Verification

`npm test` exercises label/carton/fraction math, whole-batch allocation, leftovers, historical goals, day completion, number-word dictation parsing, local dates, backup validation, atomic storage and stale-tab write protection.

Browser checks covered 393×852 and 440×956 layouts, plus a shorter 393×759 browser viewport; label review and logging; reload persistence; batch saving and fractional portion logging; calendar completion; Undo; and the service-worker update flow. The production app was also reloaded and navigated with its local server stopped, confirming the cached shell worked. Real iOS/Android installation and keyboard dictation still require device testing.

## Files

- `src/core.js`: pure calculations and data validation.
- `src/storage.js`: atomic local persistence and revision conflicts.
- `src/app.js`: screens, forms and interactions.
- `src/styles.css`: responsive visual design and accessibility preferences.
- `src/catalog.js`: explicit estimate data and source links.
- `public/`: manifest, service worker and app icons.
- `scripts/build.js`: static build with content-versioned caches.
- `scripts/icons.js`: reproducible app icon generation.

After a production update, use Settings → Refresh data → Update app when offered. Old caches are replaced without deleting food logs. During development, a previously installed service worker may still serve the older build until this update is accepted.

# Build log

Newest first. One entry per completed [ROADMAP.md](ROADMAP.md) step.

## 2026-10-02 — Step 14: alarm panel glitches

**Problem.**
- A cleared `<input type="time">` (`""`) made `nextOccurrenceEpoch` throw:
  unhandled rejection, no feedback.
- Bridge failures (e.g. iOS rejecting since step 12, or a Java exception on
  Android) left the panel looking as if nothing happened.
- Two overlapping Android permission requests: the native side answers via
  one global callback, so the first promise never settled.
- Alarm lists (panel + Nightstand) showed times in the *device's* zone, so
  "7:00 in Tokyo" read as e.g. "Fri 23:00" in Dublin; alarms didn't store
  their zone.
- Found on the way: the inexact Android fallback window was
  `[time − 10 min, time]`, i.e. it could ring up to 10 min **early**, while
  the UI (in all 10 languages) says it "may ring up to ~10 min late".

**Change.**
- `CityAlarms`: Set is disabled unless the time is a valid `HH:MM`; set and
  cancel wrapped in `try`/`finally`; failures show a new translated
  `scheduleFailed` message (10 locales).
- `nativeBridge.ts`: concurrent Android permission requests share one
  in-flight promise; `scheduleCityAlarm` passes the IANA zone.
- Alarms store `timeZone` end-to-end (Android `StoredAlarm` + PendingIntent
  extras so Snooze keeps it; iOS `StoredAlarm` as an optional, so data saved
  by older versions still decodes). New `formatAlarmTime` shows each alarm
  in its own zone, used by the panel and Nightstand mode.
- Android: inexact window now opens *at* the alarm time (matches the
  promise in the UI); `scheduleAlarm` throws on a non-finite time (NaN →
  epoch 0 would have rung immediately).

**Verified.**
- `npm test` 34/34 (new: `formatAlarmTime`, permission de-duplication);
  lint, `tsc -b` clean.
- Android `compileDebugKotlin` + `lintDebug` → 0 errors. Swift
  `-parse` OK; the iOS `StoredAlarm`/`encodeAlarms` code compiled and run on
  Linux: old saved data (no `timeZone`) decodes, new data round-trips,
  missing zone encodes as `null`.
- Headless Chromium (browser in Dublin, fake Android bridge, Tokyo selected):
  status "Alarm set for Sat 07:00", list "Tokyo, Japan — Sat 07:00"; empty
  time → Set disabled; bridge throwing → "Couldn't set the alarm — please
  try again.", no page errors.

## 2026-10-02 — Step 13: iOS alarm limitation documented

**Problem.** iOS "alarms" are ordinary local notifications (muted by the
silent switch and Focus, one short sound), and `ios/README.md` claimed iOS
has no alarm API for third-party apps — untrue since AlarmKit (iOS 26).

**Decision (repo owner).** Document now; AlarmKit is a follow-up feature
(it can't be compiled or tested here, and CI's Xcode 16 can't build it).

**Change.** `ios/README.md`: removed the outdated claim; added a
*Limitation* note explaining what iOS alarms can't do and the AlarmKit plan.
Root `README.md` mobile section mentions the difference from Android.
`ROADMAP.md` gains a *Follow-ups* section (AlarmKit; Android
`addWebMessageListener` from step 6).

## 2026-10-02 — Step 12: iOS alarm bookkeeping and JS escaping

**Problem.**
- Fired alarms were never removed from the `UserDefaults` list (only
  cancelling removed them), so the Alarm panel and Nightstand mode showed
  past alarms forever.
- `scheduleAlarm` ignored `UNUserNotificationCenter.add`'s error and
  reported `ok` (and stored the alarm) before iOS had accepted it.
- Error text was spliced into `evaluateJavaScript` with only `"` escaped —
  a backslash or newline (e.g. in a localised CoreLocation error) produced
  invalid JS, so the promise never settled.
- A NaN `epochMillis` would reach `UNTimeIntervalNotificationTrigger`,
  which raises (crash) for a non-positive/NaN interval.

**Change.**
- `listAlarms` drops alarms whose time has passed (`pruneFiredAlarms`).
- `scheduleAlarm` persists and resolves `ok` only in `add`'s completion,
  on the main thread; failures reject with the system's message. NaN /
  infinite times are rejected as invalid arguments.
- New `javaScriptStringLiteral` (JSON-encoded) used for every string sent
  back to JS, in both bridges.
- iOS README updated.

**Verified.** `swiftc -parse` OK for all files. `javaScriptStringLiteral`
extracted verbatim, compiled on Linux, and its output for seven hostile
strings (quotes, trailing backslash, newlines/tabs, `</script>`, U+2028,
template/backtick) evaluated in Node → all round-trip exactly.
**Not verified.** On a device/simulator. Note the JS side doesn't yet show
a rejected `scheduleAlarm` to the user — that's step 14.

## 2026-10-02 — Step 11: Android ringing screen

**Problem.**
- **Crash on Android 8.0** (found by lint in step 10): `setShowWhenLocked`
  / `setTurnScreenOn` are API 27, `minSdk` is 26 → `NoSuchMethodError` the
  moment an alarm rang.
- Back finished the activity: ringing stopped but the *ongoing* alarm
  notification stayed stuck (couldn't be swiped).
- `singleInstance` without `onNewIntent`: a second alarm firing while one
  rang was ignored by the UI, and its notification was left behind.
- No timeout: an unanswered alarm rang forever. Rotation recreated the
  activity, restarting the ringing.
- `requestExactAlarmPermission` would crash (`ActivityNotFoundException`) if
  called below Android 12 (lint `InlinedApi`; not reachable from the UI).

**Change.**
- API-27 calls guarded, falling back to `FLAG_SHOW_WHEN_LOCKED |
  FLAG_TURN_SCREEN_ON` on 8.0.
- Back is ignored (Snooze/Dismiss are the way out, like the Clock app).
- The screen tracks every alarm it's ringing for (`onNewIntent` adds one);
  Snooze/Dismiss act on all of them.
- Silences after 10 minutes, replacing the ongoing notification with a
  swipeable "Missed alarm: …" one (`AlarmReceiver.postMissedNotification`).
- `configChanges` on the activity so rotation doesn't restart it.
- Label text now uses a string resource with a placeholder.
- `AlarmBridge.requestExactAlarmPermission` is a no-op below Android 12.

**Verified.** `compileDebugKotlin` OK; `lintDebug` → 0 errors (was 2); the
remaining warnings are cosmetic (button styles, overdraw, icon) plus
dependency-update notices.
**Not verified.** On-device: two overlapping alarms, the 10-minute
timeout, and the 8.0 code path.

## 2026-10-02 — Step 10: Android alarms silently lost

**Problem.**
- A force-stop, or revoking "Alarms & reminders" access, cancels every
  AlarmManager alarm without telling the app; the store kept them, but
  nothing re-armed them until the next reboot.
- Granting exact-alarm access later left existing alarms on their inexact
  window.
- `BootReceiver` wasn't direct-boot aware: after an overnight reboot (e.g.
  an OS update) alarms weren't re-armed until the first unlock — and the
  store lived in credential-encrypted storage, unreadable before it.
- `AlarmStore` locked per *instance*, but every component creates its own,
  so concurrent read-modify-write updates could drop an alarm.

**Change.**
- `AlarmScheduler.rescheduleAll`: re-arms future alarms, drops past ones;
  idempotent (an alarm's PendingIntent replaces itself). Called on boot,
  on `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` (upgrades
  inexact → exact) and on every `MainActivity` launch.
- `BootReceiver`, `AlarmReceiver`, `AlarmRingActivity` marked
  `directBootAware`; `BootReceiver` also handles `LOCKED_BOOT_COMPLETED`.
- `AlarmStore` uses device-protected storage, migrating the old file once
  the user is unlocked (`moveSharedPreferencesFrom`); one process-wide lock.
- Android README updated.

**Verified.** `compileDebugKotlin` OK. `lintDebug`: no findings from these
changes. It did surface two **pre-existing errors** — `AlarmRingActivity`
calls `setShowWhenLocked`/`setTurnScreenOn` (API 27) with `minSdk 26`, i.e.
the ringing screen crashes on Android 8.0 — queued for step 11.
**Not verified.** On-device: reboot-without-unlock, force-stop → relaunch,
and granting exact-alarm access with an inexact alarm pending.

## 2026-10-02 — Step 9: privacy policy accuracy (backups kept on)

**Problem.** `public/privacy.html` said "no storage" (the app stores theme,
12/24 h and pinned cities in local storage) and that nothing about an alarm
"leaves your device" — but Android's `allowBackup="true"` (and iCloud Backup
on iOS) can include that data in the OS's own device backup.

**Decision (repo owner).** Keep backups on — users keep their pins/alarms on
a new phone — and make the policy say so.

**Change.**
- Summary no longer claims "no storage"; new *What's stored on your device*
  section listing exactly what's kept, how to delete it, and a *Device
  backups* note (handled by Google/Apple under the user's account, never
  sent to or readable by World Time).
- Location section: the nearest city isn't put in the page address; it's
  only in a link if the user chooses *Copy link* (true since step 8).
- Time sync section names the three services and the 90 s interval.
- Last-updated date bumped; manifest comment records why backup stays on.

**Verified.** Tags balanced; wording reviewed against the code paths
(storage keys, Copy link, sync interval).

## 2026-10-02 — Step 8: share URL leaking the geolocated city; geolocation overriding the user

**Problem.**
- On launch the app selects the nearest city to the user's GPS fix and
  wrote it into the address bar — so it landed in browser history/sync and
  in any URL the user pasted, while the privacy policy says location is
  discarded.
- `hasSharedSelectionRef` only reflected a share link, so if the user picked
  something before geolocation (and the ~2 MB city dataset) finished, the app
  replaced their pick with the nearest city.

**Change.**
- `App.tsx`: the nearest-city default is marked `auto` and kept out of the
  address bar; any user selection (city or point) sets `userChoseRef`, which
  the geolocation callback now respects.
- `CopyLinkButton` takes a `url` built from the card's selection
  (`shareURLFor`), so explicitly copying the auto-selected city still works.
- `shareLink.ts`: `shareURLFor` (shared by the address bar and Copy link);
  tests added.

**Verified.** `npm test` 31/31, lint, `tsc -b` clean. Headless Chromium with
geolocation faked to Dublin, new vs old build:

| | old build | new build |
|---|---|---|
| Address bar after auto-select | `?lat=53.3331&lon=-6.2489&name=Dublin…` | *(empty)* |
| Copy link | Dublin link | Dublin link |
| Click globe before lookup finishes | replaced by "Dublin, Ireland" | stays "Selected Point" |

## 2026-10-02 — Step 7: iOS `LocalSchemeHandler` traversal and task race

**Problem.**
- *Traversal:* the requested path was appended to `www/` unchecked. On
  iOS 16 (the deployment target) `URL.path` percent-decodes `%2F`, so
  `app://local/..%2F..%2Fx` could read files outside `www/`. (Newer
  Foundation — e.g. on Linux, and likely iOS 17+ — keeps `%2F` encoded, so
  exploitability varies by OS; only script already in the page could ask.)
- *Race:* `stop` recorded cancellation asynchronously, so an in-flight
  request could still call `didReceive` on a task WebKit had already stopped
  (WebKit raises an exception → crash). Cancelled IDs were also never
  removed, so a later task reusing the same address could hang forever.

**Change.**
- New `LocalSchemeHandler.resolveFile(requestPath:in:)`: standardises and
  resolves symlinks, then requires the result to stay inside `www/` (the
  root is resolved once at init, so `/var` vs `/private/var` compare equal).
- All `WKURLSchemeTask` calls now happen on the main thread (where WebKit
  calls `start`/`stop`), gated on an `activeTasks` set that both completion
  and `stop` remove from — no window for a stopped task to be called, and no
  IDs left behind. File I/O stays on the background queue.

**Verified.** `resolveFile` extracted verbatim from the source and run under
Swift 6.1.2 on Linux against a temp tree: `..%2F`, `%2E%2E/`, already-decoded
`/../`, a sibling-prefix trick (`/../www2/...`) and a symlink pointing outside
`www/` are all refused; `/`, `index.html`, `assets/./a.js` resolve correctly.
`swiftc -parse` OK.
**Not verified.** The main-thread task handling needs a device/simulator
(no WebKit on Linux).

## 2026-10-02 — Step 6: native bridges only answer the app's own page

**Problem (latent).** Android's `addJavascriptInterface` bridges and iOS's
message handlers are exposed to *any* page the web view shows, and neither
shell restricted navigation or checked the caller — Android also granted
geolocation to any origin. No link in today's UI leaves the bundled app, but
one future `<a href>` would have let a third-party page read/schedule alarms
and get location silently.

**Change.**
- Android `MainActivity`: `shouldOverrideUrlLoading` refuses everything
  outside `https://appassets.androidplatform.net`; a user-tapped http(s)
  link opens in the browser instead. Geolocation is denied to any other
  origin.
- iOS: `WebViewController` is now the `WKNavigationDelegate` and cancels any
  navigation outside `app://local` (tapped http(s) links open in Safari);
  `GeolocationBridge` and `NativeBridge` ignore messages unless they come from
  the app's main frame (`LocalSchemeHandler.isAppFrame`, based on the frame's
  request URL rather than `securityOrigin`, whose shape for custom schemes I
  couldn't confirm here).
- Considered and deferred: replacing `addJavascriptInterface` with
  `WebViewCompat.addWebMessageListener` (origin allow-list built in) — it makes
  every Android bridge call async and needs a `nativeBridge.ts` rework;
  locking navigation closes the realistic path.
- Android and iOS READMEs updated.

**Verified.** Android: `compileDebugKotlin` OK. iOS: `swiftc -parse` (Swift
6.1.2 on Linux) OK for all files — syntax only; UIKit/WebKit types can't be
checked without Xcode.
**Not verified.** On-device behaviour on either platform. The iOS
simulator build in CI (`ios-build.yml`, runs on PRs) is the first real
compile check.

## 2026-10-02 — Step 5: malformed time-API payload blanking the page

**Problem.** Source parsers weren't validated: a 200 response with an
unexpected body (e.g. `{}` from TimeAPI.io) parsed to `NaN`, the source was
still marked `ok`, and `computeConsensusOffset` only filtered out `null` —
so the consensus became `NaN`, `correctedNow()` an Invalid Date, and
formatting it threw during render. Most likely to bite US users, for whom
Binance returns HTTP 451 and only two sources remain.

**Change.**
- `timeSources.ts`: `isPlausibleSourceTime` — finite and between 2020 and
  2100 (deliberately *not* bounded against the device clock, which may be
  legitimately far off); a failing parse marks the source `error`
  (`unexpected payload`). Consensus now requires `Number.isFinite`.
- `useTimeSources.ts`: `correctedNow()` ignores a non-finite offset as a
  last line of defence.
- `timeSources.test.ts`: plausibility bounds, NaN-safe consensus, and a
  stubbed-`fetch` run of the review's scenario (Binance 451 + `{}` body).

**Verified.** `npm test` 29/29; the new scenario tests fail against the old
code. Headless Chromium with the three APIs intercepted (`{}` / 451 /
valid) → page renders, clocks tick, consensus finite.

## 2026-10-02 — Step 4: crafted share links (and blocked storage) blanking the page

**Problem.** `?tz=Foo/Bar` reached `Intl.DateTimeFormat` during render,
which throws; with no error boundary React unmounted everything → blank page,
and reloading the same URL crashed again. While fixing it I found the same
class of crash in the settings hooks: `localStorage` *throws* (rather than
returning null) when the browser blocks site storage (e.g. Chrome's "Block
all cookies"), and `useTheme`/`useHourFormat` read it unguarded during
render. Stored pinned cities were also trusted as-is.

**Change.**
- `shareLink.ts`: new `parseShareParams` — rejects non-finite or
  out-of-range lat/lon, drops unknown time zones (link degrades to a point
  selection), trims/caps `name`/`country` at 100 chars.
- `timeZone.ts`: `isValidTimeZone` helper.
- `storage.ts`: `readStorage`/`writeStorage` that swallow storage errors;
  used by the theme, hour-format and pinned-cities hooks.
- `usePinnedCities.ts`: `parseStoredPinned` drops malformed entries
  (bad shape, unknown zone) and caps at the pin limit.
- `ErrorBoundary.tsx` wraps `<App>`: translated "Something went wrong" screen
  with **Start over**, which reloads *without* the query string. Strings
  added to all 10 locales; styles in `index.css` so they load even when
  `App` itself crashed.
- Tests: `shareLink.test.ts`, `usePinnedCities.test.ts`, `storage.test.ts`.

**Verified.**
- `npm test` 25/25, `npm run lint`, `tsc -b` clean.
- Headless Chromium against the production build:
  1. `?lat=1&lon=1&name=X&tz=Foo/Bar` → renders, shows a point selection.
  2. Forced render crash → fallback screen; **Start over** → URL `/time/`.
  3. Storage blocked (getter throws `SecurityError`) → renders normally.
     The same scenario against the pre-change build (separate worktree) →
     blank page, confirming the crash was real.

## 2026-10-02 — Step 3: alarms an hour off on DST-transition days

**Problem.** `zonedWallTimeToUtc` corrected the wall time by the zone's
offset measured at the wrong instant (the wall time read as if it were UTC).
When a DST change fell between that instant and the real one, the alarm was
an hour off — e.g. New York 04:00 on spring-forward day rang at 05:00;
Berlin 01:30 rang at 00:30.

**Change.**
- `alarmTime.ts`: try the offsets in effect just before and just after any
  nearby transition and keep the one(s) that read back as the requested wall
  time. Repeated hour (autumn) → first occurrence; skipped hour (spring) →
  shifted later by the gap (02:30 → 03:30), as Temporal does by default.
- Added **vitest** (v5, works with the existing Vite 6.4) and `npm test`.
- `src/lib/alarmTime.test.ts`: 10 tests — normal, month/year rollover,
  half-hour offset, five DST-day cases in three hemispheres/zones, repeated
  and skipped hours.

**Verified.** `npm test` 10/10 pass; the same tests against the old code →
6 fail (so they genuinely catch the bug). `npm run lint`, `tsc -b` clean.

## 2026-10-02 — Step 2: Android location permission on Android 12+

**Problem.** `MainActivity` requested `ACCESS_FINE_LOCATION` on its own.
Since Android 12, for apps targeting API 31+, the system ignores that request
(it must be paired with `ACCESS_COARSE_LOCATION`), so the permission dialog
never appeared and geolocation always failed. It also only *checked* for
FINE, so a user who chose "Approximate" was treated as having refused.

**Change.** Request both with `RequestMultiplePermissions`; treat either
grant as success (approximate is enough to pick the nearest city), both when
checking and when handling the result.

**Verified.** `./gradlew compileDebugKotlin` compiles.
**Not verified.** On-device behaviour (no emulator in this container) —
check on an Android 12+ phone: fresh install → the location dialog now
appears offering Precise/Approximate; either choice flies the globe to the
nearest city.

## 2026-10-02 — Step 1: isolate the Android release signing key in CI

**Problem.** The single `build` job in `android-build.yml` ran `npm ci`, the
Vite build and Gradle (i.e. every npm/Gradle dependency's code), used
tag-pinned third-party actions, held a `contents: write` token, *and* had the
release keystore and passwords in its environment. A compromised dependency
or action could have exfiltrated the signing key — and anyone holding it can
ship APKs that Android installs as updates over the genuine app.

**Change.**
- Split the workflow into four jobs by trust level:
  - `build` — runs all the dependency code; read-only token, no secrets.
    Builds the debug APK and an **unsigned** release APK
    (`assembleRelease -PunsignedRelease`).
  - `sign-release` (tags only, `android-release` environment) — no checkout,
    no third-party actions; signs with the runner's own `zipalign` +
    `apksigner`, verifies, writes the `.sha256`.
  - `publish-debug` / `publish-release` — `contents: write`, no secrets;
    publish with the preinstalled `gh` CLI instead of a third-party action.
- Every action pinned to a full commit SHA (tag in a comment), within the
  majors already in use (upgrades are step 17).
- `gradle/actions/wrapper-validation` checks `gradle-wrapper.jar` is genuine.
- `checkout` uses `persist-credentials: false`.
- Gradle: new `-PunsignedRelease` switch; `npm ci --ignore-scripts`
  (dependency install scripts are the usual npm supply-chain entry point).
- `android/README.md` release-signing section updated.

**Verified (locally, in this container).**
- `npm ci --ignore-scripts` + `npm run build:android` → builds.
- `./gradlew assembleRelease -PunsignedRelease` → APK; `apksigner verify` →
  *DOES NOT VERIFY* (unsigned, as intended).
- `./gradlew assembleRelease` with no keystore → still debug-signed.
- `actionlint` (with shellcheck) → clean.
- Ran the extracted `sign-release` script against a throwaway keystore →
  signed APK verifies (v2 scheme), `sha256sum -c` passes; without secrets it
  fails with the error annotation. Found and fixed: `apksigner` also emits a
  `.apk.idsig` (v4) file that would have been published as a stray asset —
  now `--v4-signing-enabled false`. (The script's `trap rm` clean-up line was
  stripped for the local dry run, so that one line wasn't exercised.)
- Ran both publish scripts against a stub `gh` → expected commands/notes.

**Not verified.** A real GitHub Actions run (needs a PR or push to `main`/a
tag). Repo owner action: optionally move the four `ANDROID_KEYSTORE_*`
secrets into the `android-release` environment and restrict it to `v*` tags.

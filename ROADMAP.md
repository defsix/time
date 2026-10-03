# Roadmap — bug & security fixes

Working through the findings of the October 2026 bug & security review, in
order of priority. Details of each completed step are in
[BUILDLOG.md](BUILDLOG.md).

## Fix first

- [x] 1. Isolate the Android release signing key in CI (build / sign / publish jobs, SHA-pinned actions, Gradle wrapper validation)
- [x] 2. Android location permission broken on Android 12+ (FINE requested without COARSE)
- [x] 3. Alarms fire an hour early/late on DST-transition days (`alarmTime.ts`) + add unit tests
- [x] 4. Crafted share link (`?tz=`) blanks the page — validate params, add an error boundary (+ blocked-storage crash, stored-pin validation)
- [x] 5. Malformed time-API payload (NaN offset) blanks the page

## Security (latent / lower)

- [x] 6. Native bridges answer any origin — restrict to the app's own origin (Android + iOS)
- [x] 7. iOS `LocalSchemeHandler` path traversal and stop/start race
- [x] 8. Share URL leaks the geolocated nearest city; geolocation overrides the user's own pick
- [x] 9. Privacy policy inaccuracies + Android backup rules

## Bugs

- [x] 10. Android alarms silently lost (force-stop / permission revoked / direct boot)
- [x] 11. Android ringing screen: Back leaves a stuck notification, second alarm ignored, rings forever (+ Android 8.0 crash found by lint)
- [x] 12. iOS: fired alarms never leave the list; scheduling errors ignored; JS string escaping
- [x] 13. iOS alarms are ordinary notifications — documented; AlarmKit is a follow-up (owner's decision)
- [x] 14. Alarm panel: empty time input, overlapping permission requests, list shows wrong zone (+ inexact window rang early, not late)
- [x] 15. Globe re-uploads GPU buffers every frame; incomplete clean-up
- [x] 16. Time sync keeps polling in background tabs

## CI / release

- [x] 17. Debug-APK key consistency, signing-cert fingerprint, Node 20 EOL + action majors, wrapper checksum, Pages permissions, dev-dep audit, tests in CI

## Release

- [x] Bump Android to `versionCode 6` / `versionName "1.5"`
- [ ] Tag `v1.5` to build the signed release APK (owner)

## Follow-ups (outside this pass)

- [ ] iOS: adopt AlarmKit (iOS 26+) for real alarms, keeping notifications as the fallback — needs Xcode 26 (CI runner upgrade) and on-device testing
- [ ] Android: replace `addJavascriptInterface` with `WebViewCompat.addWebMessageListener` (built-in origin allow-list) — makes bridge calls async, needs a `nativeBridge.ts` rework

## Store release (Play Store + F-Droid) — when ready

Decision (2026-10-03): **one app signing key for every channel**, staged —
Play and GitHub first; F-Droid shares it only if builds prove reproducible,
otherwise F-Droid signs with its own key.

- [ ] Generate the new app signing key **offline on a trusted machine** (`keytool … -keyalg RSA -keysize 4096 -validity 10000 -storetype PKCS12`); record its SHA-256 fingerprint; two offline backups. Existing GitHub installs will need one reinstall.
- [ ] Put it in the `android-release` environment secrets (restricted to `v*` tags, required reviewer)
- [ ] Raise `targetSdk` to 36 (Play requirement for new apps since 31 Aug 2026) and test the Android 15/16 behaviour changes — likely the longest task
- [ ] Build and sign an AAB for Play (the pipeline currently produces APKs only)
- [ ] Play Console: at App Signing choose **"use my own key"** (one-way door — a Google-generated key can never match GitHub/F-Droid) and create a **separate upload key**; complete full-screen-intent / exact-alarm / location declarations and the Data safety form
- [ ] F-Droid: check the release build is bit-for-bit reproducible (npm/Vite output, baseline profiles); if yes, F-Droid publishes our signed APK, if not, it uses its own key; expect a NonFreeNet anti-feature for the third-party time APIs
- [ ] Publish the signing-cert fingerprint in the README

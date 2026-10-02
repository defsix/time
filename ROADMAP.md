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
- [ ] 13. iOS alarms are ordinary notifications — decide on AlarmKit (iOS 26+)
- [ ] 14. Alarm panel: empty time input, overlapping permission requests, list shows wrong zone
- [ ] 15. Globe re-uploads GPU buffers every frame; incomplete clean-up
- [ ] 16. Time sync keeps polling in background tabs

## CI / release

- [ ] 17. Debug-APK key consistency, signing-cert fingerprint, Node 20 EOL + action majors, wrapper checksum, Pages permissions, dev-dep audit, tests in CI

# World Time — iOS

A Swift/SwiftUI iOS app that packages the existing web app (`../src`) and
shows it in a full-screen `WKWebView`, the same approach as the
[Android app](../android/README.md). There's no separate native UI or
reimplemented logic — the globe, city search, time sync, and Sun & Moon
panel are the same React/Three.js code that runs on the live site.

## How it's wired together

- **No `.xcodeproj` is committed.** [`project.yml`](project.yml) is an
  [XcodeGen](https://github.com/yonaskolb/XcodeGen) spec; running
  `xcodegen generate` produces `WorldTime.xcodeproj` deterministically. This
  avoids the merge-conflict-prone, hand-edited `.pbxproj` file — regenerate
  it any time from `project.yml`.
- A "Sync Web Assets" Run Script build phase
  ([`Scripts/sync-web-assets.sh`](Scripts/sync-web-assets.sh)) runs
  `npm run build:ios` in the repo root before every build and copies the
  output into `WorldTime/Resources/www`. That folder is gitignored — it's
  regenerated, not hand-edited.
- `npm run build:ios` (see root `package.json`) builds with
  `vite --mode ios`, which switches `vite.config.ts` to relative asset paths
  (`./assets/...`) instead of the `/time/` prefix used for GitHub Pages —
  the same mechanism the Android build uses.
- **Custom `app://` scheme instead of `file://`.**
  [`LocalSchemeHandler.swift`](WorldTime/WebView/LocalSchemeHandler.swift)
  serves the bundled assets under `app://local/...` via `WKURLSchemeHandler`.
  `file://` pages send `Origin: null` on fetch(), which some CORS setups
  reject even when they otherwise allow `*`; a custom scheme gives the
  time-sync APIs a stable, non-null origin instead. This mirrors why the
  Android build uses `WebViewAssetLoader`'s synthetic https origin rather
  than `file://`.
- **Geolocation bridge.** Unlike Android's `WebView`, `WKWebView` has no
  built-in Geolocation Web API at all. [`geolocation-shim.js`](WorldTime/WebView/geolocation-shim.js)
  (injected as a `WKUserScript`) replaces `navigator.geolocation` with a
  shim that forwards `getCurrentPosition()` calls to
  [`GeolocationBridge.swift`](WorldTime/WebView/GeolocationBridge.swift) over
  `window.webkit.messageHandlers`, which resolves them via CoreLocation and
  calls back into the page. This is what powers the nearest-city default on
  load.
- **Status-bar-aware view controller.** [`WebViewContainer.swift`](WorldTime/WebView/WebViewContainer.swift)
  is a `UIViewControllerRepresentable` (not the simpler `UIViewRepresentable`)
  wrapping [`WebViewController.swift`](WorldTime/WebView/WebViewController.swift),
  so `NativeBridge` can drive `preferredStatusBarStyle` at runtime to match
  the web app's own theme — see below.

## City alarms & Nightstand mode

Both features from the [Android app](../android/README.md#city-alarms) are
implemented here too, sharing the same web-side code
(`src/lib/nativeBridge.ts`, `src/components/CityAlarms.tsx`,
`src/components/NightstandMode.tsx`) via
[`NativeBridge.swift`](WorldTime/WebView/NativeBridge.swift) and
[`native-bridge-shim.js`](WorldTime/WebView/native-bridge-shim.js):

- **The bridge is async, not synchronous.** Android's `WebView.addJavascriptInterface`
  methods can return a value directly; `WKWebView` has no such mechanism —
  every native call is a `postMessage` tagged with a request id, resolved
  or rejected later via `window.__worldTimeBridgeResolve`/`Reject` once
  `NativeBridge.swift` calls back with `evaluateJavaScript`.
  `nativeBridge.ts` wraps both shapes behind one Promise-based API so the
  UI components don't need to know which platform they're on.
- **Alarms are local notifications, not "AlarmManager".** iOS has no
  scheduled-exact-alarm API for third-party apps; a one-shot
  `UNTimeIntervalNotificationTrigger` fires at an absolute instant instead,
  computed the same way as Android (`src/lib/alarmTime.ts` converts the
  target city's wall-clock time to a UTC epoch before calling in, so the
  trigger interval is just `epoch - now` regardless of time zone). There's
  no Android-style "exact alarm" special-access permission to request on
  iOS — `hasExactAlarmPermission()` always resolves `true` there.
  `NativeBridge` opts in to foreground presentation
  (`UNUserNotificationCenterDelegate.willPresent`) so an alarm that fires
  while the app is already open still shows instead of being silently
  dropped, and persists the pending-alarms list in `UserDefaults` purely so
  `listAlarms()` can enumerate it (the notifications themselves are
  scheduled and fired by the OS, so unlike Android there's no
  `BootReceiver`-equivalent needed for reboot survival).
- **Keep-awake** uses `UIApplication.shared.isIdleTimerDisabled`, mirroring
  Android's `FLAG_KEEP_SCREEN_ON`.
- **Status bar appearance** is set via `WebViewController.setStatusBarAppearance`,
  called from `NativeBridge` the same way `App.tsx` already calls Android's
  equivalent — both platforms react to the web app's own theme/Nightstand
  state, not just the device's system dark/light mode.

## Building

Prerequisites: a Mac with Xcode, [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(`brew install xcodegen`), and Node.js (needed because the build pulls in the
web app automatically).

```bash
cd ios
xcodegen generate       # produces WorldTime.xcodeproj from project.yml
open WorldTime.xcodeproj
```

Then just build and run from Xcode (⌘R) — the "Sync Web Assets" build phase
builds the web app and refreshes `WorldTime/Resources/www` automatically.
Re-run `xcodegen generate` any time `project.yml` changes.

### Prebuilt Simulator app via CI

[`.github/workflows/ios-build.yml`](../.github/workflows/ios-build.yml) builds
an **unsigned iOS Simulator app** on GitHub's macOS runners on every push/PR
that touches the app (and on demand via "Run workflow"), and uploads it as a
zipped artifact (`world-time-ios-simulator`). Download it, unzip, then either
drag `WorldTime.app` onto a running Simulator window or install it with
`xcrun simctl install booted WorldTime.app`.

This is **not** a device-installable `.ipa`: no Apple Developer signing
certificate or provisioning profile is configured for this repo, so real
devices need those set up first (see below).

### Building a real-device `.ipa`

To get something installable on a physical iPhone, you need your own Apple
Developer Program membership. Locally, that's just a matter of opening
`WorldTime.xcodeproj` in Xcode, setting your team under Signing & Capabilities,
and building for a connected device or archiving (Product → Archive). To do
it in CI instead, you'd add your signing certificate (as a base64-encoded
`.p12` secret) and provisioning profile to this repo's GitHub Actions secrets
and extend `ios-build.yml` to import them and build/export with
`CODE_SIGNING_ALLOWED=YES` and a real team ID — ask if you want that wired up.

## Known limitation of this change

This was developed in a sandboxed Linux environment with no Xcode, no iOS
Simulator, and no Swift toolchain at all, so none of this — not the project
generation, not the Swift code, not the custom scheme handler, geolocation
bridge, city alarms, or Nightstand mode — could be compiled or run here. The
web app build (`npm run build:ios`) was verified directly, and the Swift code
follows well-documented `WKURLSchemeHandler` / `WKScriptMessageHandler` /
`UNUserNotificationCenter` patterns, but please treat the first
`xcodegen generate` + build in Xcode as the real first test, and expect to
iron out a few rough edges. In particular:

- The CORS behavior of the time-sync APIs under a custom scheme origin (see
  above) is a reasoned bet, not something verified against the real APIs here.
- `UIViewControllerRepresentable`'s `preferredStatusBarStyle` propagation
  through SwiftUI's `WindowGroup` hosting hierarchy is a well-documented
  pattern, but hasn't been visually confirmed switching themes on-device.
- The alarm-scheduling math (`UNTimeIntervalNotificationTrigger` computed
  from an epoch) and the foreground-presentation opt-in
  (`willPresent` → `.banner, .sound, .list`) follow Apple's documented
  `UserNotifications` APIs, but treat the first real alarm you set and let
  ring as the actual first test of that logic — the same caveat the Android
  app's alarm code carries.

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
generation, not the Swift code, not the custom scheme handler or geolocation
bridge — could be compiled or run here. The web app build (`npm run
build:ios`) was verified directly, and the Swift code follows well-documented
`WKURLSchemeHandler` / `WKScriptMessageHandler` patterns, but please treat the
first `xcodegen generate` + build in Xcode as the real first test, and expect
to iron out a few rough edges (in particular, the CORS behavior of the
time-sync APIs under a custom scheme origin — see above — is a reasoned bet,
not something verified against the real APIs here).

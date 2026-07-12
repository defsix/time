# World Time — Android

A Kotlin Android app that packages the existing web app (`../src`) and shows
it in a full-screen `WebView`. There's no separate native UI or reimplemented
logic — the globe, city search, time sync, and Sun & Moon panel are the same
React/Three.js code that runs on the live site.

## How it's wired together

- `app/build.gradle.kts` defines Gradle tasks (`npmInstall`, `buildWebApp`,
  `syncWebAssets`) that run `npm run build:android` in the repo root and copy
  the output into `app/src/main/assets/www` before every build. That folder is
  gitignored — it's regenerated, not hand-edited.
- `npm run build:android` (see root `package.json`) builds with
  `vite --mode android`, which switches `vite.config.ts` to relative asset
  paths (`./assets/...`) instead of the `/time/` prefix used for GitHub Pages.
- `MainActivity.kt` serves those bundled assets through
  `androidx.webkit.WebViewAssetLoader` at
  `https://appassets.androidplatform.net/assets/www/` (the library's
  `DEFAULT_DOMAIN`) rather than a `file://` URL, so `fetch()` calls to the
  time-sync APIs see a real HTTPS origin and behave the same as they do on
  the deployed site.
- Geolocation (used for the nearest-city default) is wired through
  `WebChromeClient.onGeolocationPermissionsShowPrompt`, backed by a runtime
  `ACCESS_FINE_LOCATION` permission request.

## City alarms

The clock card's **Alarm** button lets you set an alarm for a specific local
time *there* — e.g. "ring when it's 7:00 AM in Tokyo" while you're in New
York. It's available on both the "Your Location" card (using your own
timezone) and the selected-city card (using that city's timezone) — the
component takes a plain `targetTz`/`targetLabel` pair, not a `City`, so it
works either way. This only appears in the mobile apps (feature-detected via
`isAlarmBridgeAvailable()`, absent on the plain website) — both Android and
iOS now implement it, backed by different native scheduling primitives (see
[`../ios/README.md`](../ios/README.md#city-alarms--nightstand-mode) for iOS's
`UNUserNotificationCenter`-based implementation).

The popover positions itself relative to the toggle button's actual
on-screen position (measured via `getBoundingClientRect`, clamped to stay
within the viewport), rather than CSS-anchoring to the button's own edge —
that button sits mid-row (Pin/Alarm/Copy link), not at the card's edge, so a
plain `right: 0` anchor could push the fixed-width popover off the left edge
of narrow screens.

- `src/lib/alarmTime.ts` converts "HH:MM in an IANA zone" to the next future
  UTC instant using only `Intl.DateTimeFormat` (no timezone database
  dependency), correctly handling DST.
- `src/lib/nativeBridge.ts` / `src/components/CityAlarms.tsx` are the web
  side: a time picker, a list of pending alarms, and permission nudges.
  `nativeBridge.ts` is shared with the iOS app too — every call is
  Promise-based so it works the same whether the underlying bridge is
  Android's synchronous `addJavascriptInterface` or iOS's async
  `WKScriptMessageHandler` round-trip (see [`../ios/README.md`](../ios/README.md#city-alarms--nightstand-mode)).
- On the native side (`android/app/.../alarm/`):
  - `AlarmBridge.kt` is the `@JavascriptInterface` the web app calls.
  - `AlarmScheduler.kt` uses `AlarmManager.setAlarmClock()` (the same
    API the built-in Clock app uses) when the exact-alarm special access is
    granted, and gracefully falls back to a ~10-minute inexact window
    otherwise — per Android 14's guidance for apps that don't have that
    permission.
  - `AlarmStore.kt` persists the alarm list (AlarmManager can't be
    enumerated), which `BootReceiver.kt` reads to reschedule everything
    after a reboot (raw alarms don't survive one).
  - `AlarmReceiver.kt` posts a full-screen-intent notification when the
    alarm fires; `AlarmRingActivity.kt` is the actual ringing screen
    (shows over the lock screen, loops the default alarm sound, vibrates,
    Snooze/Dismiss).
  - Requires runtime `POST_NOTIFICATIONS` (Android 13+) and the
    `SCHEDULE_EXACT_ALARM` special access (Settings > Apps > Special app
    access > Alarms & reminders) for precise timing; the UI prompts for
    both as needed.

## Nightstand mode

The **Nightstand** header button switches to a full-screen ambient display
and keeps the screen on — for propping the phone on a nightstand overnight:

- The globe itself renders full-bleed in the background, slowly auto-rotating
  at one revolution per 10 minutes (`Globe`'s `forceAutoRotate` /
  `autoRotateSpeed` props — a much slower, always-on variant of the existing
  idle auto-spin, bypassing its fly-home-first behavior).
- The current local time, date, and pinned cities' times are overlaid on top
  (`pointer-events: none`, so drags still reach the globe underneath, while a
  plain tap anywhere still exits).
- Any pending city alarms are listed too, soonest first.

Keeping the screen on uses the standard Web Wake Lock API
(`src/lib/useWakeLock.ts`, works on the plain website too) with a native
`FLAG_KEEP_SCREEN_ON` fallback via `window.AndroidDisplayBridge`
(`DisplayBridge.kt`) in case a WebView's Wake Lock support is unreliable.

## Status bar / edge-to-edge

`MainActivity` calls `enableEdgeToEdge()` and draws the WebView under the
system status/navigation bars, rather than relying on a native window
background there. Previously that background (and the status bar's icon
color) only ever reflected the *device's* system dark/light mode via the
`values-night` resource qualifier — completely independent of the web app's
own Light/Dark/Auto theme choice, which could show as a white bar at the top
while the app was actually in its dark theme (or during Nightstand mode,
which is always black regardless of the app theme).

Instead:
- The page's own background now paints all the way to the screen edges.
- `window.AndroidDisplayBridge.setStatusBarAppearance(isLightBackground)`
  (`DisplayBridge.kt`) sets the status bar's icon color at runtime; `App.tsx`
  calls it whenever the resolved theme or Nightstand mode changes, so it
  always matches what's actually on screen.
- Since Android's WebView doesn't support CSS `env(safe-area-inset-*)` the
  way WKWebView on iOS does, `MainActivity` measures the real system bar
  insets (`ViewCompat.OnApplyWindowInsetsListener`) and forwards them into
  the page as `--safe-area-top` / `--safe-area-bottom` CSS custom properties
  (`injectSafeAreaInsets`, re-applied on every page load too). `index.css`
  defines those same properties via `env(safe-area-inset-*, 0px)` first, so
  iOS (with `viewport-fit=cover` now set) and the plain website both get
  sensible values for free.

## Play Store release signing

The `release` build type is R8-minified (`isMinifyEnabled = true`); the two
`@JavascriptInterface` classes the web app calls into (`AlarmBridge`,
`DisplayBridge`) are kept via `proguard-rules.pro` — R8 has no way to know
WebView will call them reflectively, so without that rule a minified build
would silently break every native bridge call with no compile error.

Signing is optional and never committed:

- **Locally:** generate a keystore (`keytool -genkeypair -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias world-time-release`),
  copy [`keystore.properties.example`](keystore.properties.example) to
  `keystore.properties` (gitignored) and fill in the real paths/passwords,
  then `./gradlew bundleRelease` produces a signed `.aab` ready to upload to
  the Play Console.
- **In CI:** [`android-build.yml`](../.github/workflows/android-build.yml) also
  builds `bundleRelease` on every push/PR. Set these repo secrets once a real
  release keystore exists — `ANDROID_KEYSTORE_BASE64` (`base64 -w0 release.jks`),
  `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` —
  and the workflow decodes and signs with it automatically.
- **Without either:** the release build type falls back to debug signing, so
  `assembleRelease`/`bundleRelease` still succeed (useful for smoke-testing
  the minified build shape) — just not upload-able to Play as-is.

A [privacy policy](../public/privacy.html) is also published at
`https://defsix.github.io/time/privacy.html` — the Play Console requires one
for apps requesting location/notification permissions.

## Building

Prerequisites: Android Studio (or the command-line SDK) and Node.js — Node is
needed because the build pulls in the web app automatically.

```bash
cd android
./gradlew assembleDebug     # builds the web app, syncs assets, builds the APK
./gradlew installDebug      # ...and installs it on a connected device/emulator
```

Or just open the `android/` folder in Android Studio and run it.

### Prebuilt APK via CI

[`.github/workflows/android-build.yml`](../.github/workflows/android-build.yml)
builds a debug APK on every push/PR that touches the app (and on demand via
"Run workflow"). Grab it from the workflow run's **Artifacts** section
(`world-time-debug-apk`) without needing a local Android SDK.

**Stable download link:** every push to `main` also republishes the APK to a
rolling GitHub Release, so this URL always points at the latest build (unlike
the per-run artifact link above, which expires after ~90 days):

```
https://github.com/defsix/time/releases/download/android-debug-latest/app-debug.apk
```

or browse it at <https://github.com/defsix/time/releases/tag/android-debug-latest>.

## Known limitation of this change

This was developed in a sandboxed environment without an Android SDK and
without network access to `dl.google.com` / Maven Google, so the Gradle build
could not be executed end-to-end here — this includes the city alarms and
nightstand mode native code (AlarmManager/notification/vibration/MediaPlayer
APIs), which was cross-checked against Android's documentation but not
compiled or run on a device. CI (`android-build.yml`) at least confirms it
compiles; please treat your first real device test of setting and letting an
alarm ring as the actual first test of that logic.

The R8-minified release build type (and its ProGuard keep rules for the
JS-interface classes) is likewise unverified beyond CI compiling it — treat
the first real install of a `bundleRelease` output as the first real test
that the native bridges still work under minification.

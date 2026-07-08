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
could not be executed end-to-end here. The web app build (`npm run
build:android`) was verified directly. Please do a first `./gradlew
assembleDebug` locally before relying on this.

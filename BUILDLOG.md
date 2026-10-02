# Build log

Newest first. One entry per completed [ROADMAP.md](ROADMAP.md) step.

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

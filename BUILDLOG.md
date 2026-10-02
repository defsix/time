# Build log

Newest first. One entry per completed [ROADMAP.md](ROADMAP.md) step.

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

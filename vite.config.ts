import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://defsix.github.io/time/ on GitHub Pages, so built asset
// URLs need the /time/ prefix in production; local dev keeps root-relative paths.
// The Android app (mode: 'android') bundles this build into its own assets and
// serves it from a different local path, so it needs relative asset URLs instead.
export default defineConfig(({ command, mode }) => ({
  base: mode === 'android' ? './' : command === 'build' ? '/time/' : '/',
  plugins: [react()],
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://defsix.github.io/time/ on GitHub Pages, so built asset
// URLs need the /time/ prefix in production; local dev keeps root-relative paths.
// The Android and iOS apps (mode: 'android' / 'ios') bundle this build into
// their own assets and serve it from a different local path, so they need
// relative asset URLs instead.
export default defineConfig(({ command, mode }) => ({
  base: mode === 'android' || mode === 'ios' ? './' : command === 'build' ? '/time/' : '/',
  plugins: [react()],
}))

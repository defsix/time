import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://defsix.github.io/time/ on GitHub Pages, so built asset
// URLs need the /time/ prefix in production; local dev keeps root-relative paths.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/time/' : '/',
  plugins: [react()],
}))

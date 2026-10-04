import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Em `vite build` o react-scan sai inteiro do bundle.
    alias:
      command === 'build'
        ? [{ find: /^\.\/lib\/reactScan$/, replacement: '/src/lib/reactScan.noop.js' }]
        : [],
  },
}))

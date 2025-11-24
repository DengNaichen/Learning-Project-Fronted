import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://aether-web-372668020909.northamerica-northeast2.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
      },
    },
  },
})

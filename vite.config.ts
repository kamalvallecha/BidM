import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: import.meta.env.VITE_PROD
          ? 'https://bidm-smartprocure.replit.app'
          : 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

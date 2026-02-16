import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/categories': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/payment-methods': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/expenses': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

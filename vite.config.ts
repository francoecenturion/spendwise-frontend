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
      },
      '/income': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/savings-wallets': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/savings': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/issuing-entities': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/debts': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/setup': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/gmail': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/mail': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

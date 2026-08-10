import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend habla siempre con rutas relativas (/api/...). En desarrollo el
// proxy las redirige a uvicorn, así que no hace falta CORS ni URLs absolutas.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

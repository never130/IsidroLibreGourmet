import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No es necesario importar 'path' ni usar '__dirname' con este enfoque

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Usar URL y import.meta.url para una resolución de ruta más robusta en Vite
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Opcional: reescribir la ruta si es necesario, por ejemplo, si tu backend no tiene el prefijo /api
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      }
    }
  }
})

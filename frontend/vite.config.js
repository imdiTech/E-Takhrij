import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Tambahkan konfigurasi untuk proxy ke backend Django
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Jika frontend diakses via port lain (misalnya 3000), Anda mungkin perlu: 
      // Anda bisa menambahkan konfigurasi ini jika frontend dijalankan di port 3000:
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    },
    // Opsional: Jika backendDjango berjalan di port lain atau localhost, 
    // pastikan Anda menggunakan port yang benar di sini
    // Contoh: target: 'http://localhost:8001' jika Django di port 8001
    // Anda juga mungkin perlu menambahkan port Django ke `allowed_hosts` di backend.
  }
})

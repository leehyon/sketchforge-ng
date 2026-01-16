import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '10.228.36.150',
    port: 8787,
    // HMR will try to connect back to the host used to access the site.
    // If you access via the host IP the default settings should work.
    // You can also set VITE_DEV_SERVER_HOST env var for custom HMR host.
    hmr: {
      // leave `host` undefined to let Vite infer it from the incoming requests;
      // set an explicit host with the VITE_DEV_SERVER_HOST env var when needed.
      host: process.env.VITE_DEV_SERVER_HOST || undefined,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

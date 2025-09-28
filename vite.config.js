import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// Minimal Tailwind setup via Vite plugin (no tailwind.config.js)
export default defineConfig({
  plugins: [react(), tailwind()],
  server: { port: 5173, open: true }
})

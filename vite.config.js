import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import sitemap from 'vite-plugin-sitemap'

// In ESM, __dirname is not defined. Recreate it from import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sitemap({ hostname: 'https://cicerowebstudio.xyz' })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Alias para facilitar las importaciones
    },
  },
  // Dev server and preview will both use port 5174
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['icons/icon.svg'], manifest: { name: 'It Girl Planner', short_name: 'It Girl', description: 'Личное пространство для планирования и целей', theme_color: '#171114', background_color: '#171114', display: 'standalone', start_url: './', scope: './', icons: [{ src: './icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] } })],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' },
})

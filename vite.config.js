import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'MHealth – Antenatal Care',
        short_name: 'MHealth',
        description: 'Antenatal Care Support System for pregnant women in Cameroon',
        theme_color: '#ee2b8c',
        background_color: '#f8f6f7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /\/api\/health-content\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'knowledge-hub-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          }
        ]
      }
    })
  ],
  server: { port: 3000 }
})

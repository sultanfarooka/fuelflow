import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { qrcode } from 'vite-plugin-qrcode'; // Import the plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    qrcode(),
    // M07-F08 — PWA. Silent auto-update SW, app-shell-only precache (no API
    // caching — see workbox block). Manifest values: theme/background from the
    // design-system --primary/--background tokens (oklch → sRGB).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'app-icon.svg'],
      manifest: {
        name: 'Fuel Flow',
        short_name: 'Fuel Flow',
        description: 'Filling station management',
        theme_color: '#ca3500',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'en',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // App-shell-only precache (interview decision): cache the static build
      // output + fonts/icons for offline launch, fall back to index.html for SPA
      // navigations. No runtimeCaching — API responses are never cached; offline
      // data calls surface the global retry banner instead (R03).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      // Service worker is disabled on the dev server; flip locally only to debug.
      // Verify PWA behaviour against `npm run build && npm run preview`.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

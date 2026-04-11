import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'icon-192.png', 'icon-512.png', 'icon-192-maskable.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Twitch CoPilot - Streamer Navigation',
        short_name: 'CoPilot',
        description: 'Interactive cargo bike navigation for Twitch streamers. Chat-controlled routes, POI discovery, and community adventures.',
        theme_color: '#9146FF',
        background_color: '#1a1028',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        start_url: './',
        categories: ['navigation', 'maps', 'travel', 'utilities'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache BRouter routing API responses
            urlPattern: /^https:\/\/brouter\.de\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'routing-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Nominatim geocoding responses
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocoding-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache Overpass POI API responses
            urlPattern: /^https:\/\/overpass\.api\.de\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'poi-api',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache tile server responses (map tiles)
            urlPattern: /^https:\/\/.*\.(arcgisonline\.com|cartocdn\.com|opentopomap\.org|openstreetmap\.org)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache weather API
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 15, // 15 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',  // CRITICAL: relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

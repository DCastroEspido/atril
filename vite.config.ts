/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { alphaTab } from '@coderline/alphatab-vite';
import { VitePWA } from 'vite-plugin-pwa';

// BASE lets the same build run at the domain root or under a sub-path (GitHub Pages).
const base = process.env.BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    alphaTab(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Atril',
        short_name: 'Atril',
        description: 'Tablaturas para practicar con banda: velocidad, bucles y pistas de acompañamiento.',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        background_color: '#e6e9ec',
        theme_color: '#2346b8',
        categories: ['music', 'education'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        file_handlers: [
          {
            action: base,
            accept: {
              'application/x-guitar-pro': ['.gp', '.gp3', '.gp4', '.gp5', '.gpx'],
              'application/vnd.recordare.musicxml+xml': ['.musicxml', '.xml'],
              'application/vnd.recordare.musicxml': ['.mxl'],
            },
          },
        ],
      },
      workbox: {
        // The soundfont (1.3 MB) and the alphaTab chunk (1.1 MB) must be precached for offline playback.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'font/Bravura.woff2', 'soundfont/sonivox.sf2'],
        globIgnores: ['font/Bravura.svg'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  // alphaTab runs its renderer and synthesizer in a worker and an audio worklet; minify them like the app.
  worker: { format: 'es', rolldownOptions: { output: { minify: true } } },
  build: { chunkSizeWarningLimit: 1600 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

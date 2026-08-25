# LifeOS — PWA & offline

LifeOS is an installable Progressive Web App.

## Installing
- **Chrome / Edge (desktop & Android):** open the app → address‑bar install icon, or menu → *Install LifeOS*.
- **iPhone / Safari:** Share → *Add to Home Screen*. iOS runs it standalone with the theme‑colored status bar.

## How offline works
- **App data** lives in IndexedDB (Dexie), so habits, gamification, notes, etc. work fully offline regardless of the cache.
- **App shell** is cached by the service worker (`public/sw.js`): navigations use network‑first with an offline fallback (`/offline`); static assets use stale‑while‑revalidate.
- **Cloud‑only features** (Supabase sync, and future market prices / AI / Spotify) degrade gracefully with clear offline states.

## Service worker in development
The service worker is **only registered in production builds**. In development it is actively unregistered so it can’t cache built chunks and break HMR. Test PWA behavior with:
```bash
npm run build && npm run start
```

## Production icons (action item)
The manifest ships an SVG icon (`public/icons/icon.svg`) that covers modern Chromium and Safari. For maximum install reliability across **all** browsers, add raster icons and reference them in `src/app/manifest.ts`:
- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512, provide a `maskable` variant)

Generate them from the SVG with any icon tool (e.g. `sharp`, `pwa-asset-generator`) as part of your release process.

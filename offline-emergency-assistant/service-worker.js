/* ============================================================
   OFFLINE AI EMERGENCY ASSISTANT — service-worker.js
   Cache-first strategy for full offline support
   ============================================================ */

const CACHE_NAME = 'emergency-ai-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './data/firstaid.json',
    './data/disasters.json',
    './data/contacts.json',
    './assets/icons/sos.png',
    './assets/icons/firstaid.png',
    './assets/icons/disaster.png',
    './assets/icons/contact.png',
    './assets/images/logo.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;600;700&display=swap'
];

/* ── Install: pre-cache all assets ── */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

/* ── Fetch: cache-first, fallback to network ── */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((response) => {
                // Don't cache bad responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                // Cache a clone of the response
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(() => {
                // Return offline fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

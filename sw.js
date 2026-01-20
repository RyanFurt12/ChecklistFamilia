const CACHE_NAME = 'habit-v1';
const ASSETS = [
    'index.html',
    'manifest.json'
];

self.addEventListener('install', (e) => {
    console.log('Service Worker instalado');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

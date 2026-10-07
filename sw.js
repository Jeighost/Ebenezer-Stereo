/* Ebenezer Stereo · service worker
   - Páginas: primero la red (siempre la versión más nueva), caché solo si no hay conexión.
   - Recursos propios (fuentes, íconos, logos): caché y actualización en segundo plano.
   - La transmisión en vivo y SoundCloud nunca pasan por aquí. */
const VERSION = 'ebz-v1';
const CORE = [
    './',
    'index.html',
    'manifest.webmanifest',
    'assets/favicon.svg',
    'assets/icon-192.png',
    'assets/brand/simbolo.svg',
    'assets/fonts/fraunces-normal.woff2',
    'assets/fonts/fraunces-italic.woff2',
    'assets/fonts/manrope-normal.woff2',
    'assets/fonts/jetbrains-mono-normal.woff2'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req)
                .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
                .catch(() => caches.match(req).then(r => r || caches.match('./')))
        );
        return;
    }

    e.respondWith(
        caches.match(req).then(cached => {
            const net = fetch(req).then(res => {
                if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
                return res;
            }).catch(() => cached);
            return cached || net;
        })
    );
});

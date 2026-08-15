/* Pro Kalkulator Ultra – service worker (offline + PWA) */
const CORE = 'pku-core-v1';
const RUNTIME = 'pku-runtime-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CORE)
      .then(c => Promise.allSettled(CORE_ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CORE && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Navigasjon: nettverk først, fallback til hurtiglaget index (offline) */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CORE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  const url = new URL(req.url);

  /* Egne filer: hurtiglagring med fallback til nettverk */
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CORE).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  /* Eksterne ressurser (flagg, kurser): stale-while-revalidate med tak */
  e.respondWith(
    caches.match(req).then(hit => {
      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, copy).then(() => trimCache(c)));
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});

function trimCache(cache) {
  return cache.keys().then(keys => {
    if (keys.length > 150) return cache.delete(keys[0]).then(() => trimCache(cache));
  });
}
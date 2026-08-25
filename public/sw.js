/* TECH 221 — lightweight app-shell service worker (PWA). */
const CACHE = 'tech221-v2'
const APP_SHELL = ['/', '/manifest.webmanifest', '/diamant.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Network-first for navigations (always fresh when online), else cache fallback.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    )
    return
  }

  // Stale-while-revalidate for same-origin static assets.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response && response.status === 200 && new URL(request.url).origin === location.origin) {
            cache.put(request, response.clone())
          }
          return response
        })
        return cached || network
      })
    )
  )
})

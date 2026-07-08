const CACHE = "ip-v3";
const STATIC = ["/", "/favicon-indique.png", "/icon-192.png", "/icon-512.png", "/manifest.json"];
const SKIP = ["/api/", "/master", "/consultor", "/indicador"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  if (url.origin !== self.location.origin) return;
  if (SKIP.some((s) => url.pathname.startsWith(s))) return;

  const isAsset = /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)(\?.*)?$/.test(url.pathname);

  if (isAsset) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          const network = fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
          return cached || network;
        })
      )
    );
  }
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Nova indicacao!', {
      body: data.body ?? 'Voce recebeu uma nova indicacao.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'nova-indicacao',
      renotify: true,
      data: { url: data.url ?? '/consultor/leads' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/consultor/leads'));
});

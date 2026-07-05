const CACHE = "ip-assets-v1";

// Apenas assets estaticos sao cacheados — nunca paginas ou APIs autenticadas
const CACHEABLE = /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf)$/;

const ROTAS_PRIVADAS = ["/master", "/consultor", "/indicador", "/api/"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Nunca cachear rotas privadas ou APIs
  if (ROTAS_PRIVADAS.some((r) => url.pathname.startsWith(r))) return;

  // Cachear apenas assets estaticos com extensao conhecida
  if (!CACHEABLE.test(url.pathname)) return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        });
      })
    )
  );
});

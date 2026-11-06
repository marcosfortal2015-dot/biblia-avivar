// v2 — guarda o app para uso sem internet.
// "biblia-avivar-offline-*" é o cache preenchido pelo botão "Baixar para usar sem internet"
// (Bíblia inteira + arquivos do app); nunca é apagado na atualização.
const CACHE_NAME = "biblia-avivar-v2";
const KEEP_PREFIX = "biblia-avivar-offline";
const APP_SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/logo-icone.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && !k.startsWith(KEEP_PREFIX)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (pra sempre pegar texto bíblico/estudos
// atualizados); se falhar (sem internet), cai pro que estiver em cache.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // abrir o app (inclusive por link ?m=...) sem internet: entrega a página principal guardada
        if (req.mode === "navigate") {
          const shell = (await caches.match("/", { ignoreSearch: true })) || (await caches.match("/index.html"));
          if (shell) return shell;
        }
        return new Response("", { status: 504, statusText: "Sem conexão" });
      })
  );
});

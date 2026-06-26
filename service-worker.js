// sw para jugar offline. cachea todo y responde cache-first.
// OJO: tiene que estar en la raiz para controlar todas las rutas

const CACHE = "memory-lsc-v1";

const APP = [
  "./",
  "./index.html",
  "./css/estilos.css",
  "./js/juego.js",
  "./manifest.json",
];

const ids = [
  "casa",
  "familia",
  "biblioteca",
  "libro",
  "parque",
  "jugar",
  "mercado",
  "fruta",
  "colegio",
  "maleta",
  "rio",
  "agua",
];

const frases = [
  "familia_casa",
  "libro_biblioteca",
  "jugar_parque",
  "fruta_mercado",
  "maleta_colegio",
  "agua_rio",
];

const imgs = ["./img/dorso.svg"].concat(
  ids.map((id) => "./img/" + id + ".svg"),
);
const audios = ids
  .map((id) => "./audio/" + id + ".mp3")
  .concat(frases.map((n) => "./audio/" + n + ".mp3"));
const videos = ids.map((id) => "./lsc/" + id + ".mp4");

const TODO = [...APP, ...imgs, ...audios, ...videos];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      // cacheo uno por uno asi si falta un mp3/mp4 no se cae todo
      return Promise.all(TODO.map((r) => cache.add(r).catch(() => {})));
    }),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;

      return fetch(e.request)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copia = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, copia));
          }
          return resp;
        })
        .catch(() => caches.match("./index.html")); // fallback offline
    }),
  );
});

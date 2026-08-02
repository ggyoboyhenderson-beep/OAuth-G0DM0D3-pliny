/* Vitality Health — service worker: fresh-first with offline fallback.
   Online: every open fetches the newest version (updates flow straight
   through, no manual refreshing). Offline: everything serves from cache. */
var CACHE = "vitality-v9";
var SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./calculators.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Network-first for same-origin GETs: fresh content on every load while
// online (kept in cache as we go), full cache fallback when offline.
// External links (WHO, CDC, ...) pass through untouched.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        // Offline navigation falls back to the cached app shell.
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("./index.html");
        return hit;
      });
    })
  );
});

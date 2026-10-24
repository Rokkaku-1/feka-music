const CACHE = "feka-music-offline-v1";
// Cache only the offline notice: never music, searches, account responses or keys.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.add(new URL("./offline.html", self.location).href),
      ),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("feka-music-offline-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    event.request.mode !== "navigate" ||
    url.origin !== self.location.origin
  )
    return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(new URL("./offline.html", self.location).href),
    ),
  );
});

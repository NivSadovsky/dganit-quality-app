// Minimal service worker — required by some browsers (Chrome/Android) for
// PWA installability. Deliberately does no caching/offline logic yet: the
// app is online-only for v1 (see architecture_decisions memory) — this is
// just the hook to build a real offline strategy on top of later.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

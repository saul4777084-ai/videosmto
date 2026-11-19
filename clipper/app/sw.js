// Service worker mínimo: hace que Chrome ofrezca «Instalar app».
// No guarda nada en caché: siempre pide la versión nueva al servidor.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

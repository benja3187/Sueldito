/* SUELDITO · service worker: notificaciones push y copia de la página para abrir sin conexión */
const CACHE = 'sueldito-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
// Página: primero la red (siempre la versión nueva); sin conexión, la última guardada.
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try { const res = await fetch(r); const c = await caches.open(CACHE); c.put('/', res.clone()); return res; }
    catch (err) { return (await caches.match('/')) || Response.error(); }
  })());
});
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'SUELDITO', {
    body: d.body || '', tag: d.tag || 'sueldito', renotify: true,
    icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', location.origin).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if (new URL(c.url).origin === location.origin) { await c.focus(); if ('navigate' in c) return c.navigate(url); return; }
    return self.clients.openWindow(url);
  })());
});

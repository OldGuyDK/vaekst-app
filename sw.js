const CACHE = 'vaekst-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  // Fortæl alle åbne vinduer at der er en ny version klar
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => list.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(list => list.forEach(c => c.postMessage({ type: 'SW_ACTIVATED' })))
  );
});

self.addEventListener('fetch', e => {
  // Hent altid ny version fra netværk — fald tilbage til cache ved fejl
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Modtag notifikationsbesked fra hovedtråden
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'NOTIFY') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title, {
      body,
      tag,
      vibrate: [200, 100, 200],
      requireInteraction: true,
    });
  }
});

// Klik på notifikation åbner appen
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

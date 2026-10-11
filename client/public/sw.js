self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Smart Routine', {
    body: payload.body || '',
    icon: '/icon.svg',
    tag: payload.tag || 'smart-routine-notification',
    data: { url: payload.url || '/app' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/app', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === target);
    return existing ? existing.focus() : self.clients.openWindow(target);
  }));
});

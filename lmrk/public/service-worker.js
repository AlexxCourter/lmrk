self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'LMRK', {
      body: data.body || 'There is a new update!',
      icon: '/vercel.svg', // Change to your app icon if desired
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

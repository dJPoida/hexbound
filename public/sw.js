self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'no data'}"`);

  const title = 'Hexbound Game';
  const options = {
    body: event.data ? event.data.text() : 'A new turn has begun!',
    icon: '/vite.svg', // Optional: replace with a proper game icon later
    badge: '/vite.svg' // Optional: replace with a proper game badge later
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  // Optional: Add logic to focus an existing tab or open a new one
  // event.waitUntil(
  //   clients.openWindow('https://example.com')
  // );
}); 
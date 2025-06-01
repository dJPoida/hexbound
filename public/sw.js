const CACHE_NAME = 'hexbound-cache-v1'; // Example cache name, can be versioned too

// Install event - cache assets and call skipWaiting
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  // Perform install steps, like caching static assets (optional for this immediate fix)
  // event.waitUntil(
  //   caches.open(CACHE_NAME).then(cache => {
  //     console.log('[SW] Caching app shell');
  //     return cache.addAll([
  //       '/', // or specific assets like index.html, main.css, etc.
  //       // Add other assets critical to your app shell here
  //     ]);
  //   })
  // );
  self.skipWaiting(); // Activate new SW immediately
});

// Activate event - claim clients
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  // Clean up old caches (optional, good practice for versioned caches)
  // event.waitUntil(
  //   caches.keys().then(cacheNames => {
  //     return Promise.all(
  //       cacheNames.map(cacheName => {
  //         if (cacheName !== CACHE_NAME) { // Example: remove caches not matching current
  //           console.log('[SW] Deleting old cache:', cacheName);
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  event.waitUntil(self.clients.claim()); // Take control of open clients
});

self.addEventListener('push', function(event) {
  console.log('[SW PUSH] Event received.'); // Log 1

  let notificationTitle = 'Hexbound Game';
  let notificationBody = 'A new turn has begun!';
  let gameIdForMessage = null;

  if (event.data) {
    const rawPushData = event.data.text();
    console.log('[SW PUSH] Event has data. Raw text:', rawPushData); // Log 2
    try {
      const parsedData = JSON.parse(rawPushData); // Attempt parse
      console.log('[SW PUSH] Parsed data:', parsedData); // Log 3
      
      notificationTitle = parsedData.title || notificationTitle;
      notificationBody = parsedData.body || notificationBody;
      if (parsedData.data && parsedData.data.gameId) {
        gameIdForMessage = parsedData.data.gameId;
      }
      console.log(`[SW PUSH] Using Title: "${notificationTitle}", Body: "${notificationBody}", GameID for msg: ${gameIdForMessage}`); // Log 4
    } catch (e) {
      console.error('[SW PUSH] JSON.parse failed:', e); // Log 5 (Error)
      // Use raw text as body if parsing failed
      notificationBody = rawPushData; 
      console.log(`[SW PUSH] Using default title, raw body: "${notificationBody}", No GameID for msg (parse failed)`); // Log 6
    }
  } else {
    console.log('[SW PUSH] Event has no data.'); // Log 7
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/vite.svg', 
    badge: '/vite.svg',
    data: { gameId: gameIdForMessage } // Pass gameId to notification data
  };

  console.log('[SW PUSH] Notification options prepared:', notificationOptions); // Log 8

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[SW PUSH] Notification shown. Attempting to find clients.'); // Log 9
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then(clientList => {
        console.log('[SW PUSH] clients.matchAll found clients:', clientList ? clientList.length : 'null/undefined'); // Log 10
        if (clientList && clientList.length > 0) {
          clientList.forEach(client => {
            const messagePayload = { type: 'GAME_UPDATE_NOTIFICATION', gameId: gameIdForMessage };
            console.log('[SW PUSH] Posting message to client:', client.id, 'Payload:', messagePayload); // Log 11
            client.postMessage(messagePayload);
          });
        } else {
          console.log('[SW PUSH] No clients found to post message to. GameID was:', gameIdForMessage); // Log 12
        }
      })
      .catch(err => {
        console.error('[SW PUSH] Error in waitUntil chain (showNotification or client messaging):', err); // Log 13 (Error)
      })
  );
  console.log('[SW PUSH] event.waitUntil called.'); // Log 14
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.', event.notification.data);
  event.notification.close();

  const gameId = event.notification.data ? event.notification.data.gameId : null;
  let urlToOpen = self.registration.scope; // Default to SW scope (your app's root)

  if (gameId) {
    urlToOpen = `${self.registration.scope}?game=${gameId}`;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's a window for this game already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // A more robust check might involve parsing client.url to see if it matches gameId
        // For now, if any client is open, focus it.
        // If specific game targeting is needed, client.url should be checked against urlToOpen
        if (client.url.includes(self.registration.scope) && 'focus' in client) { // Basic check for app URL
            try {
                // Attempt to navigate if gameId is present and URL differs, then focus
                if (gameId && client.url !== urlToOpen && client.navigate) {
                    return client.navigate(urlToOpen).then(c => c.focus());
                } 
                return client.focus();
            } catch (e) {
                // Fallback if navigate/focus fails
                console.warn("[Service Worker] Could not focus or navigate existing client, opening new window.", e);
                return clients.openWindow(urlToOpen);
            }
        }
      }
      // If no window is open or focus/navigate failed, open a new one
      return clients.openWindow(urlToOpen);
    })
  );
}); 
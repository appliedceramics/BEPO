// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data?.json() ?? {};
  const title = data.title || 'BEPO Insulin Calculator';
  const message = data.message || 'New notification';
  const icon = '/images/notification-icon.png'; // Default icon
  const badge = '/images/notification-badge.png'; // Default badge

  const options = {
    body: message,
    icon: data.icon || icon,
    badge: data.badge || badge,
    data: data.data || {},
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'bepo-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle actions if defined
  if (action === 'view-details' && data.url) {
    // Open specific URL
    event.waitUntil(
      clients.openWindow(data.url)
    );
    return;
  }

  // Default: Open the main app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // If a tab is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow('/');
    })
  );
});

// Service worker installation
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', function(event) {
  return self.clients.claim();
});

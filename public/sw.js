/**
 * Service Worker for Mathy — handles push notifications.
 * Receives push events from the backend (via web-push) and shows browser notifications.
 */

// Show notification when push event is received from backend
self.addEventListener('push', (event) => {
  let data = {
    title: 'Mathy — Time to Play! 🧠',
    body: 'Your daily brain workout is ready!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/',
  }

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch {
    // Use defaults if payload parsing fails
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: 'mathy-daily',
      renotify: true,
      data: { url: data.url },
    })
  )
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

/**
 * Service Worker for Mathy
 * - PWA: caches essential static assets for offline shell
 * - Push: handles daily 8 PM IST notifications from backend
 *
 * SAFETY: Does NOT cache API requests, Supabase calls, or dynamic game data.
 * IndexedDB and localStorage continue working normally.
 */

const CACHE_NAME = 'mathy-v1'

// Only cache the app shell — static assets that rarely change
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

// ─── PWA: Install — pre-cache static shell ──────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// ─── PWA: Activate — clean up old caches ────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// ─── PWA: Fetch — network-first with cache fallback ─────────────────
// IMPORTANT: Never cache API calls, Supabase, or dynamic data

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip caching for:
  // - API requests (backend)
  // - Supabase calls
  // - Non-GET requests
  // - Chrome extensions
  // - Next.js data requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/push/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('localhost:4000') ||
    url.protocol === 'chrome-extension:' ||
    url.pathname.includes('_next/data')
  ) {
    return
  }

  // Network-first strategy: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets only
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request)
      })
  )
})

// ─── Push Notifications ─────────────────────────────────────────────

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

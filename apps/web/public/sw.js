// Service Worker for caching strategies
const CACHE_NAME = 'pixora-v1'
const STATIC_CACHE = 'pixora-static-v1'
const IMAGE_CACHE = 'pixora-images-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/gallery',
  '/login',
  '/register',
  '/manifest.json',
  '/favicon.ico',
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_FILES)
      }),
      caches.open(IMAGE_CACHE),
    ]).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== STATIC_CACHE && cacheName !== IMAGE_CACHE) {
                return caches.delete(cacheName)
              }
              return Promise.resolve()
            })
          )
        }),
      // Take control of all clients
      self.clients.claim(),
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first, cache fallback
    event.respondWith(networkFirst(request))
  } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
    // Images - Cache first, network fallback
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else if (
    STATIC_FILES.includes(url.pathname) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    // Static files - Cache first, network fallback
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else {
    // Other requests - Network first, cache fallback
    event.respondWith(networkFirst(request))
  }
})

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    // Return offline fallback if available
    return (
      caches.match('/offline.html') || new Response('Offline', { status: 503 })
    )
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('Network first strategy failed:', error)

    // Try cache fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline fallback
    return (
      caches.match('/offline.html') || new Response('Offline', { status: 503 })
    )
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline actions like cart submissions
  console.log('Background sync triggered')
}

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url || '/'))
})

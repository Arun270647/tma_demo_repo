// Track My Academy - Service Worker
// Version: 1.4.0
// This service worker provides offline capabilities, performance optimization, push notifications, badge API, and background sync

const CACHE_NAME = 'tma-cache-v5';
const DATA_CACHE_NAME = 'tma-data-cache-v5';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
  // Don't automatically skip waiting - wait for user confirmation
});

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    // NEVER cache authentication endpoints - they must always be fresh
    if (event.request.url.includes('/api/auth/')) {
      event.respondWith(
        fetch(event.request, {
          cache: 'no-store' // Force fresh request, never use cache
        })
      );
      return;
    }

    // API requests - network first, fallback to cache
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        caches.open(DATA_CACHE_NAME).then((cache) => {
          return fetch(event.request)
            .then((response) => {
              // Clone the response before caching
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Network failed, try cache
              return cache.match(event.request);
            });
        })
      );
    }
    // Static assets - cache first, fallback to network
    else {
      event.respondWith(
        caches.match(event.request).then((response) => {
          return response || fetch(event.request).catch(() => {
            // If both cache and network fail, show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
        })
      );
    }
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  // Handle different sync types
  if (event.tag.startsWith('sync-')) {
    const syncType = event.tag.replace('sync-', '');
    event.waitUntil(processSyncQueue(syncType));
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  // Parse notification data
  let data = {};
  let title = 'Track My Academy';
  let body = 'New notification';
  let icon = '/icons/icon-192x192.png';
  let badge = '/icons/icon-72x72.png';
  let url = '/';
  let actions = [];

  try {
    if (event.data) {
      data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      icon = data.icon || icon;
      badge = data.badge || badge;
      url = data.url || url;

      // Add actions based on notification type
      if (data.type) {
        switch (data.type) {
          case 'attendance':
            actions = [
              { action: 'view', title: 'View Details', icon: '/icons/icon-72x72.png' }
            ];
            break;
          case 'training_plan':
            actions = [
              { action: 'view', title: 'View Plan', icon: '/icons/icon-72x72.png' }
            ];
            break;
          case 'message':
            actions = [
              { action: 'reply', title: 'Reply', icon: '/icons/icon-72x72.png' },
              { action: 'view', title: 'View', icon: '/icons/icon-72x72.png' }
            ];
            break;
          default:
            actions = [
              { action: 'view', title: 'View', icon: '/icons/icon-72x72.png' }
            ];
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Error parsing push data:', error);
  }

  // Notification options
  const options = {
    body: body,
    icon: icon,
    badge: badge,
    vibrate: [200, 100, 200],
    data: {
      ...data,
      url: url,
      dateOfArrival: Date.now()
    },
    actions: actions,
    tag: data.tag || 'default-notification',
    requireInteraction: data.requireInteraction || false,
    silent: false
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      incrementBadgeInServiceWorker()
    ])
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);

  const notification = event.notification;
  const data = notification.data || {};
  const url = data.url || '/';

  notification.close();

  // Decrement badge when notification is clicked
  decrementBadgeInServiceWorker();

  // Handle action buttons
  if (event.action === 'view' || event.action === 'reply') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (let client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  } else {
    // Default click behavior
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (let client of clientList) {
            if ('focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }

  // Track notification click (optional - could send to analytics)
  console.log('[ServiceWorker] Notification clicked, opening:', url);
});

// Helper function for processing sync queue
async function processSyncQueue(syncType) {
  console.log(`[ServiceWorker] Processing sync queue: ${syncType}`);

  try {
    // Open IndexedDB
    const db = await openSyncDatabase();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');

    // Get all pending items of this type
    const index = store.index('type');
    const items = await new Promise((resolve, reject) => {
      const request = index.getAll(syncType);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const pendingItems = items.filter(item => item.status === 'pending');

    console.log(`[ServiceWorker] Found ${pendingItems.length} pending items`);

    // Process each item
    for (const item of pendingItems) {
      try {
        // Make the API request
        const response = await fetch(item.options.endpoint, {
          method: item.options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...item.options.headers
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          // Success - remove from queue
          await new Promise((resolve, reject) => {
            const deleteRequest = store.delete(item.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });

          console.log(`[ServiceWorker] Synced item ${item.id} successfully`);

          // Notify clients
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              syncType: item.type,
              data: item.data
            });
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[ServiceWorker] Error syncing item ${item.id}:`, error);

        // Update retry count
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
        } else {
          item.status = 'retry';
        }

        await new Promise((resolve, reject) => {
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        });

        // Notify clients of failure
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_FAILED',
            syncType: item.type,
            error: error.message
          });
        });
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Error in processSyncQueue:', error);
    return Promise.reject(error);
  }
}

// Helper function to open sync database
function openSyncDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tma-sync-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        const objectStore = db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true
        });
        objectStore.createIndex('type', 'type', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

// Badge API helper functions for service worker
async function incrementBadgeInServiceWorker() {
  if ('setAppBadge' in navigator) {
    try {
      // Get current badge count from clients
      const allClients = await clients.matchAll({ includeUncontrolled: true });

      if (allClients.length > 0) {
        // Send message to client to increment badge
        allClients[0].postMessage({ type: 'INCREMENT_BADGE' });
      } else {
        // No clients open, just increment the badge directly
        const currentBadge = await getCurrentBadgeCount();
        await navigator.setAppBadge(currentBadge + 1);
      }

      console.log('[ServiceWorker] Badge incremented');
    } catch (error) {
      console.error('[ServiceWorker] Error incrementing badge:', error);
    }
  }
}

async function decrementBadgeInServiceWorker() {
  if ('setAppBadge' in navigator) {
    try {
      const allClients = await clients.matchAll({ includeUncontrolled: true });

      if (allClients.length > 0) {
        // Send message to client to decrement badge
        allClients[0].postMessage({ type: 'DECREMENT_BADGE' });
      } else {
        // No clients open, decrement directly
        const currentBadge = await getCurrentBadgeCount();
        const newCount = Math.max(0, currentBadge - 1);
        if (newCount === 0) {
          await navigator.clearAppBadge();
        } else {
          await navigator.setAppBadge(newCount);
        }
      }

      console.log('[ServiceWorker] Badge decremented');
    } catch (error) {
      console.error('[ServiceWorker] Error decrementing badge:', error);
    }
  }
}

async function getCurrentBadgeCount() {
  // Try to get from client storage via message passing
  // For now, we'll use a simple approach with navigator API
  return 0; // This will be managed by the client-side badge helpers
}

console.log('[ServiceWorker] Loaded');

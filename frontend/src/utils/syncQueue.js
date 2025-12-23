/**
 * Background Sync Queue Manager
 * Handles offline data queuing and automatic synchronization
 */

const DB_NAME = 'tma-sync-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

/**
 * Initialize IndexedDB for offline storage
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
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

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported() {
  return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Add item to sync queue
 * @param {string} type - Type of sync (e.g., 'attendance', 'form-submission')
 * @param {object} data - Data to sync
 * @param {object} options - Additional options (endpoint, method, etc.)
 */
export async function addToSyncQueue(type, data, options = {}) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const item = {
      type: type,
      data: data,
      options: options,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    };

    const request = store.add(item);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Added to sync queue: ${type}`, item);

        // Register background sync if supported
        if (isBackgroundSyncSupported()) {
          navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register(`sync-${type}`);
          }).catch((error) => {
            console.error('Failed to register background sync:', error);
          });
        }

        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
}

/**
 * Get all pending items from sync queue
 * @param {string} type - Optional type filter
 */
export async function getPendingItems(type = null) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    let request;
    if (type) {
      const index = store.index('type');
      request = index.getAll(type);
    } else {
      request = store.getAll();
    }

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result.filter(item => item.status === 'pending');
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting pending items:', error);
    return [];
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Removed from sync queue: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    throw error;
  }
}

/**
 * Update item status in sync queue
 */
export async function updateSyncItemStatus(id, status, error = null) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }

        item.status = status;
        item.lastError = error;
        if (status === 'retry') {
          item.retryCount = (item.retryCount || 0) + 1;
        }

        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Error updating sync item status:', error);
    throw error;
  }
}

/**
 * Process sync queue (called by service worker or manually)
 */
export async function processSyncQueue(type = null) {
  try {
    const items = await getPendingItems(type);

    console.log(`Processing ${items.length} items from sync queue`);

    const results = await Promise.allSettled(
      items.map(async (item) => {
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

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Success - remove from queue
          await removeFromSyncQueue(item.id);

          return { success: true, item };
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);

          // Check if we should retry
          if (item.retryCount < item.maxRetries) {
            await updateSyncItemStatus(item.id, 'retry', error.message);
            return { success: false, retry: true, item, error };
          } else {
            await updateSyncItemStatus(item.id, 'failed', error.message);
            return { success: false, retry: false, item, error };
          }
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    console.log(`Sync complete: ${successful} successful, ${failed} failed`);

    return {
      total: items.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('Error processing sync queue:', error);
    throw error;
  }
}

/**
 * Clear all completed items from sync queue
 */
export async function clearCompletedItems() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const getAllRequest = store.getAll();

    return new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result;
        const completedItems = items.filter(item =>
          item.status === 'completed' || item.status === 'failed'
        );

        const deletePromises = completedItems.map(item => {
          return new Promise((res, rej) => {
            const deleteRequest = store.delete(item.id);
            deleteRequest.onsuccess = () => res();
            deleteRequest.onerror = () => rej(deleteRequest.error);
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            console.log(`Cleared ${completedItems.length} completed items`);
            resolve(completedItems.length);
          })
          .catch(reject);
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  } catch (error) {
    console.error('Error clearing completed items:', error);
    throw error;
  }
}

/**
 * Get sync queue statistics
 */
export async function getSyncQueueStats() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        const stats = {
          total: items.length,
          pending: items.filter(i => i.status === 'pending').length,
          completed: items.filter(i => i.status === 'completed').length,
          failed: items.filter(i => i.status === 'failed').length,
          retrying: items.filter(i => i.status === 'retry').length
        };
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting sync queue stats:', error);
    return { total: 0, pending: 0, completed: 0, failed: 0, retrying: 0 };
  }
}

/**
 * Manual sync trigger (for testing or user-initiated sync)
 */
export async function triggerManualSync() {
  console.log('Triggering manual sync...');

  if (!navigator.onLine) {
    console.log('Cannot sync: offline');
    return { success: false, message: 'Device is offline' };
  }

  try {
    const result = await processSyncQueue();
    return { success: true, ...result };
  } catch (error) {
    console.error('Manual sync failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen for online event and trigger sync
 */
export function setupAutoSync() {
  window.addEventListener('online', async () => {
    console.log('Connection restored - triggering auto-sync');
    await triggerManualSync();
  });

  console.log('Auto-sync enabled');
}

/**
 * Badge API Helper Functions
 * Manages app icon badge count for unread notifications
 */

/**
 * Check if Badge API is supported
 */
export function isBadgeSupported() {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Set badge count on app icon
 * @param {number} count - Number to display on badge (0 clears the badge)
 */
export async function setBadgeCount(count) {
  if (!isBadgeSupported()) {
    console.log('Badge API not supported');
    return false;
  }

  try {
    if (count === 0) {
      await navigator.clearAppBadge();
    } else {
      await navigator.setAppBadge(count);
    }

    // Store count in localStorage for persistence
    localStorage.setItem('tma_badge_count', count.toString());

    console.log(`Badge count set to: ${count}`);
    return true;
  } catch (error) {
    console.error('Error setting badge:', error);
    return false;
  }
}

/**
 * Clear badge from app icon
 */
export async function clearBadge() {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    await navigator.clearAppBadge();
    localStorage.setItem('tma_badge_count', '0');
    console.log('Badge cleared');
    return true;
  } catch (error) {
    console.error('Error clearing badge:', error);
    return false;
  }
}

/**
 * Increment badge count
 * @param {number} increment - Amount to increment by (default: 1)
 */
export async function incrementBadge(increment = 1) {
  const currentCount = getBadgeCount();
  const newCount = currentCount + increment;
  return await setBadgeCount(newCount);
}

/**
 * Decrement badge count
 * @param {number} decrement - Amount to decrement by (default: 1)
 */
export async function decrementBadge(decrement = 1) {
  const currentCount = getBadgeCount();
  const newCount = Math.max(0, currentCount - decrement);
  return await setBadgeCount(newCount);
}

/**
 * Get current badge count from localStorage
 */
export function getBadgeCount() {
  try {
    const count = localStorage.getItem('tma_badge_count');
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Initialize badge on app load
 * Restores badge count from localStorage
 */
export async function initializeBadge() {
  if (!isBadgeSupported()) {
    console.log('Badge API not supported on this browser');
    return false;
  }

  try {
    const storedCount = getBadgeCount();
    if (storedCount > 0) {
      await setBadgeCount(storedCount);
      console.log(`Badge initialized with count: ${storedCount}`);
    }

    return true;
  } catch (error) {
    console.error('Error initializing badge:', error);
    return false;
  }
}

/**
 * Clear badge when app gains focus
 * Called automatically when user opens/focuses the app
 */
export async function clearBadgeOnFocus() {
  await clearBadge();
}

/**
 * Track notification count
 * Increment when new notification received
 */
export async function onNotificationReceived() {
  await incrementBadge();
}

/**
 * Mark notification as read
 * Decrement badge count
 */
export async function onNotificationRead() {
  await decrementBadge();
}

/**
 * Set up automatic badge clearing when app gains focus
 */
export function setupBadgeAutoClearing() {
  if (!isBadgeSupported()) {
    return;
  }

  try {
    // Clear badge when window gains focus
    window.addEventListener('focus', clearBadgeOnFocus);

    // Clear badge when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        clearBadgeOnFocus();
      }
    });

    console.log('Badge auto-clearing enabled');
  } catch (error) {
    console.error('Error setting up badge auto-clearing:', error);
  }
}

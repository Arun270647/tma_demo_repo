/**
 * PWA Helper Utilities
 * Provides utility functions for PWA-specific features and detection
 */

/**
 * Check if the app is running in PWA mode (standalone)
 * @returns {boolean} True if running as installed PWA
 */
export function isPWA() {
  // Check multiple indicators of PWA mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  const isAndroidStandalone = document.referrer.includes('android-app://');

  return isStandalone || isIOSStandalone || isAndroidStandalone;
}

/**
 * Check if the app was installed from a browser
 * @returns {boolean} True if PWA was installed
 */
export function isPWAInstalled() {
  return localStorage.getItem('tma_pwa_installed') === 'true';
}

/**
 * Get the display mode of the app
 * @returns {string} 'standalone', 'fullscreen', 'minimal-ui', or 'browser'
 */
export function getDisplayMode() {
  const displayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];

  for (const mode of displayModes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      return mode;
    }
  }

  // Fallback for iOS
  if (window.navigator.standalone) {
    return 'standalone';
  }

  return 'browser';
}

/**
 * Check if the device is online
 * @returns {boolean} True if device is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Get the default route based on PWA mode and authentication status
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {string} The route to navigate to
 */
export function getDefaultRoute(isAuthenticated) {
  if (isAuthenticated) {
    // User is logged in, let them access the app normally
    return null; // No redirect needed
  }

  if (isPWA()) {
    // PWA users who are not authenticated should go to login
    return '/login';
  }

  // Web browser users should see the landing page
  return null; // No redirect needed
}

/**
 * Check if the current environment supports PWA features
 * @returns {Object} Object with feature support flags
 */
export function getPWAFeatureSupport() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    notifications: 'Notification' in window,
    badgeAPI: 'setAppBadge' in navigator,
    backgroundSync: 'sync' in (self.registration || {}),
    webShare: 'share' in navigator,
    installPrompt: true, // beforeinstallprompt event
    cacheAPI: 'caches' in window,
    indexedDB: 'indexedDB' in window,
    periodicBackgroundSync: 'periodicSync' in (self.registration || {})
  };
}

/**
 * Listen for display mode changes
 * @param {Function} callback - Callback function to run when display mode changes
 * @returns {Function} Cleanup function to remove the listener
 */
export function onDisplayModeChange(callback) {
  const displayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
  const listeners = [];

  displayModes.forEach(mode => {
    const mediaQuery = window.matchMedia(`(display-mode: ${mode})`);
    const handler = (e) => {
      if (e.matches) {
        callback(mode);
      }
    };

    mediaQuery.addListener(handler);
    listeners.push({ mediaQuery, handler });
  });

  // Return cleanup function
  return () => {
    listeners.forEach(({ mediaQuery, handler }) => {
      mediaQuery.removeListener(handler);
    });
  };
}

/**
 * Check if app should show the install prompt
 * @returns {boolean} True if install prompt should be shown
 */
export function shouldShowInstallPrompt() {
  const isInPWA = isPWA();
  const hasBeenDismissed = localStorage.getItem('tma_install_prompt_dismissed') === 'true';
  const isInstalled = isPWAInstalled();

  return !isInPWA && !isInstalled && !hasBeenDismissed;
}

/**
 * Mark install prompt as dismissed
 */
export function dismissInstallPrompt() {
  localStorage.setItem('tma_install_prompt_dismissed', 'true');
}

/**
 * Log PWA detection info (for debugging)
 */
export function logPWAInfo() {
  console.log('[PWA] Detection Info:', {
    isPWA: isPWA(),
    displayMode: getDisplayMode(),
    isInstalled: isPWAInstalled(),
    isOnline: isOnline(),
    features: getPWAFeatureSupport()
  });
}

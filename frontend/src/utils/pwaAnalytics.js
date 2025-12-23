/**
 * PWA Analytics & Metrics
 * Tracks installation, usage, performance, and errors
 */

// Analytics storage key
const ANALYTICS_KEY = 'tma_pwa_analytics';
const SESSION_KEY = 'tma_session_id';

/**
 * Initialize analytics
 */
export function initializeAnalytics() {
  // Generate session ID
  if (!sessionStorage.getItem(SESSION_KEY)) {
    sessionStorage.setItem(SESSION_KEY, generateSessionId());
  }

  // Track page load
  trackEvent('page_load', {
    url: window.location.href,
    referrer: document.referrer,
    timestamp: Date.now()
  });

  // Track installation state
  trackInstallationState();

  // Set up event listeners
  setupAnalyticsListeners();

  console.log('[Analytics] Initialized');
}

/**
 * Track PWA installation
 */
export function trackInstallation() {
  trackEvent('pwa_installed', {
    timestamp: Date.now(),
    platform: getPlatform(),
    userAgent: navigator.userAgent
  });

  // Update installation state
  localStorage.setItem('tma_pwa_installed', 'true');
  localStorage.setItem('tma_install_date', Date.now().toString());
}

/**
 * Track installation prompt shown
 */
export function trackInstallPromptShown() {
  trackEvent('install_prompt_shown', {
    timestamp: Date.now()
  });
}

/**
 * Track installation prompt accepted
 */
export function trackInstallPromptAccepted() {
  trackEvent('install_prompt_accepted', {
    timestamp: Date.now()
  });
}

/**
 * Track installation prompt dismissed
 */
export function trackInstallPromptDismissed() {
  trackEvent('install_prompt_dismissed', {
    timestamp: Date.now()
  });
}

/**
 * Track offline usage
 */
export function trackOfflineUsage(action, data = {}) {
  trackEvent('offline_usage', {
    action,
    ...data,
    timestamp: Date.now(),
    isOnline: navigator.onLine
  });
}

/**
 * Track service worker events
 */
export function trackServiceWorkerEvent(eventType, data = {}) {
  trackEvent('service_worker', {
    eventType,
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Track background sync
 */
export function trackBackgroundSync(syncType, success, data = {}) {
  trackEvent('background_sync', {
    syncType,
    success,
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Track notification events
 */
export function trackNotification(action, data = {}) {
  trackEvent('notification', {
    action,
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Track share events
 */
export function trackShare(shareType, success, data = {}) {
  trackEvent('share', {
    shareType,
    success,
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Track errors
 */
export function trackError(error, context = {}) {
  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now()
  });
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric, value, data = {}) {
  trackEvent('performance', {
    metric,
    value,
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Track user engagement
 */
export function trackEngagement(action, data = {}) {
  trackEvent('engagement', {
    action,
    ...data,
    timestamp: Date.now(),
    sessionId: sessionStorage.getItem(SESSION_KEY)
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature, data = {}) {
  trackEvent('feature_usage', {
    feature,
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Track custom event
 */
export function trackEvent(eventName, data = {}) {
  const event = {
    name: eventName,
    data: {
      ...data,
      sessionId: sessionStorage.getItem(SESSION_KEY),
      timestamp: Date.now()
    }
  };

  // Store event
  storeEvent(event);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, data);
  }

  // Send to analytics service (if configured)
  sendToAnalyticsService(event);
}

/**
 * Store event in local storage
 */
function storeEvent(event) {
  try {
    const analytics = getAnalytics();
    analytics.events.push(event);

    // Keep only last 1000 events
    if (analytics.events.length > 1000) {
      analytics.events = analytics.events.slice(-1000);
    }

    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('[Analytics] Error storing event:', error);
  }
}

/**
 * Get analytics data
 */
export function getAnalytics() {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Analytics] Error retrieving analytics:', error);
  }

  // Default analytics structure
  return {
    events: [],
    sessions: [],
    installation: {
      installed: localStorage.getItem('tma_pwa_installed') === 'true',
      installDate: localStorage.getItem('tma_install_date')
    }
  };
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  const analytics = getAnalytics();
  const events = analytics.events;

  return {
    totalEvents: events.length,
    installation: analytics.installation,
    eventCounts: getEventCounts(events),
    offlineUsage: getOfflineUsageStats(events),
    performance: getPerformanceStats(events),
    errors: getErrorStats(events),
    engagement: getEngagementStats(events),
    lastUpdated: Date.now()
  };
}

/**
 * Get event counts by type
 */
function getEventCounts(events) {
  const counts = {};
  events.forEach(event => {
    counts[event.name] = (counts[event.name] || 0) + 1;
  });
  return counts;
}

/**
 * Get offline usage statistics
 */
function getOfflineUsageStats(events) {
  const offlineEvents = events.filter(e => e.name === 'offline_usage');
  return {
    totalOfflineActions: offlineEvents.length,
    offlineActionTypes: getEventCounts(offlineEvents.map(e => ({ name: e.data.action }))),
    lastOfflineUsage: offlineEvents.length > 0 ? offlineEvents[offlineEvents.length - 1].data.timestamp : null
  };
}

/**
 * Get performance statistics
 */
function getPerformanceStats(events) {
  const perfEvents = events.filter(e => e.name === 'performance');
  const metrics = {};

  perfEvents.forEach(event => {
    const metric = event.data.metric;
    if (!metrics[metric]) {
      metrics[metric] = {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        values: []
      };
    }

    metrics[metric].count++;
    metrics[metric].total += event.data.value;
    metrics[metric].min = Math.min(metrics[metric].min, event.data.value);
    metrics[metric].max = Math.max(metrics[metric].max, event.data.value);
    metrics[metric].values.push(event.data.value);
  });

  // Calculate averages
  Object.keys(metrics).forEach(metric => {
    metrics[metric].average = metrics[metric].total / metrics[metric].count;
    delete metrics[metric].values; // Don't return all values in summary
  });

  return metrics;
}

/**
 * Get error statistics
 */
function getErrorStats(events) {
  const errorEvents = events.filter(e => e.name === 'error');
  return {
    totalErrors: errorEvents.length,
    errorTypes: getEventCounts(errorEvents.map(e => ({ name: e.data.message }))),
    recentErrors: errorEvents.slice(-10).map(e => ({
      message: e.data.message,
      timestamp: e.data.timestamp,
      context: e.data.context
    }))
  };
}

/**
 * Get engagement statistics
 */
function getEngagementStats(events) {
  const engagementEvents = events.filter(e => e.name === 'engagement');
  const sessions = new Set(engagementEvents.map(e => e.data.sessionId));

  return {
    totalEngagements: engagementEvents.length,
    uniqueSessions: sessions.size,
    engagementTypes: getEventCounts(engagementEvents.map(e => ({ name: e.data.action })))
  };
}

/**
 * Clear analytics data
 */
export function clearAnalytics() {
  localStorage.removeItem(ANALYTICS_KEY);
  console.log('[Analytics] Data cleared');
}

/**
 * Export analytics data
 */
export function exportAnalytics() {
  const analytics = getAnalytics();
  const summary = getAnalyticsSummary();

  return {
    analytics,
    summary,
    exportDate: new Date().toISOString()
  };
}

/**
 * Setup analytics event listeners
 */
function setupAnalyticsListeners() {
  // Track online/offline
  window.addEventListener('online', () => {
    trackEvent('connection_restored', { timestamp: Date.now() });
  });

  window.addEventListener('offline', () => {
    trackEvent('connection_lost', { timestamp: Date.now() });
  });

  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    trackEvent('visibility_change', {
      hidden: document.hidden,
      timestamp: Date.now()
    });
  });

  // Track PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    trackInstallPromptShown();
  });

  // Track errors
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), {
      type: 'unhandled_rejection'
    });
  });
}

/**
 * Track installation state
 */
function trackInstallationState() {
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isInstalled && localStorage.getItem('tma_pwa_installed') !== 'true') {
    trackInstallation();
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get platform information
 */
function getPlatform() {
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) {
    return 'Android';
  }
  if (/iPad|iPhone|iPod/.test(ua)) {
    return 'iOS';
  }
  if (/Win/.test(ua)) {
    return 'Windows';
  }
  if (/Mac/.test(ua)) {
    return 'MacOS';
  }
  if (/Linux/.test(ua)) {
    return 'Linux';
  }

  return 'Unknown';
}

/**
 * Send to analytics service (placeholder)
 * Replace with your analytics service (Google Analytics, Mixpanel, etc.)
 */
function sendToAnalyticsService(event) {
  // Example: Google Analytics
  if (window.gtag) {
    window.gtag('event', event.name, event.data);
  }

  // Example: Custom analytics endpoint
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event)
  // }).catch(console.error);
}

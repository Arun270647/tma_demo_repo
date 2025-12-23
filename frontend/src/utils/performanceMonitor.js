/**
 * Performance Monitor
 * Tracks Web Vitals and performance metrics
 */

import { trackPerformance } from './pwaAnalytics';

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
  // Track Core Web Vitals
  trackWebVitals();

  // Track custom performance metrics
  trackCustomMetrics();

  // Track resource loading
  trackResourceTiming();

  // Track navigation timing
  trackNavigationTiming();

  console.log('[Performance] Monitoring initialized');
}

/**
 * Track Core Web Vitals (CLS, FID, LCP)
 */
function trackWebVitals() {
  // Check if Performance Observer is supported
  if (!('PerformanceObserver' in window)) {
    console.log('[Performance] PerformanceObserver not supported');
    return;
  }

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      trackPerformance('LCP', lastEntry.renderTime || lastEntry.loadTime, {
        element: lastEntry.element?.tagName,
        url: lastEntry.url
      });
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.error('[Performance] Error tracking LCP:', error);
  }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackPerformance('FID', entry.processingStart - entry.startTime, {
          name: entry.name
        });
      });
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.error('[Performance] Error tracking FID:', error);
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          trackPerformance('CLS', clsValue);
        }
      });
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.error('[Performance] Error tracking CLS:', error);
  }

  // Track Time to First Byte (TTFB)
  try {
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackPerformance('TTFB', entry.responseStart - entry.requestStart);
      });
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
  } catch (error) {
    console.error('[Performance] Error tracking TTFB:', error);
  }
}

/**
 * Track custom performance metrics
 */
function trackCustomMetrics() {
  // Track when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const domReady = performance.now();
      trackPerformance('DOM_Ready', domReady);
    });
  } else {
    const domReady = performance.now();
    trackPerformance('DOM_Ready', domReady);
  }

  // Track when page is fully loaded
  window.addEventListener('load', () => {
    const pageLoad = performance.now();
    trackPerformance('Page_Load', pageLoad);

    // Track all navigation timing after load
    setTimeout(() => {
      trackDetailedTiming();
    }, 0);
  });

  // Track Time to Interactive (TTI) approximation
  if (document.readyState === 'complete') {
    trackPerformance('TTI', performance.now());
  } else {
    window.addEventListener('load', () => {
      // Rough TTI approximation: wait for long tasks to complete
      setTimeout(() => {
        trackPerformance('TTI', performance.now());
      }, 100);
    });
  }
}

/**
 * Track detailed navigation timing
 */
function trackDetailedTiming() {
  if (!performance.timing) {
    return;
  }

  const timing = performance.timing;
  const navigationStart = timing.navigationStart;

  const metrics = {
    DNS_Lookup: timing.domainLookupEnd - timing.domainLookupStart,
    TCP_Connection: timing.connectEnd - timing.connectStart,
    Server_Response: timing.responseEnd - timing.requestStart,
    DOM_Processing: timing.domComplete - timing.domLoading,
    Resource_Loading: timing.loadEventEnd - timing.loadEventStart,
    Total_Load_Time: timing.loadEventEnd - navigationStart
  };

  Object.entries(metrics).forEach(([metric, value]) => {
    if (value >= 0) {
      trackPerformance(metric, value);
    }
  });
}

/**
 * Track resource loading performance
 */
function trackResourceTiming() {
  if (!performance.getEntriesByType) {
    return;
  }

  try {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const duration = entry.duration;
        const size = entry.transferSize || 0;
        const type = entry.initiatorType;

        trackPerformance('Resource_Load', duration, {
          type,
          name: entry.name,
          size
        });
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.error('[Performance] Error tracking resources:', error);
  }
}

/**
 * Track navigation timing
 */
function trackNavigationTiming() {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  try {
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        trackPerformance('Navigation', entry.duration, {
          type: entry.type,
          redirectCount: entry.redirectCount,
          transferSize: entry.transferSize
        });
      });
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
  } catch (error) {
    console.error('[Performance] Error tracking navigation:', error);
  }
}

/**
 * Track cache hit rate
 */
export function trackCacheHit(hit) {
  trackPerformance('Cache_Hit', hit ? 1 : 0);
}

/**
 * Track service worker activation time
 */
export function trackServiceWorkerActivation(duration) {
  trackPerformance('SW_Activation', duration);
}

/**
 * Track service worker update time
 */
export function trackServiceWorkerUpdate(duration) {
  trackPerformance('SW_Update', duration);
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  if (!performance.timing) {
    return null;
  }

  const timing = performance.timing;
  const navigation = performance.navigation;

  return {
    navigation: {
      type: navigation.type,
      redirectCount: navigation.redirectCount
    },
    timing: {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseEnd - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
      load: timing.loadEventEnd - timing.loadEventStart,
      total: timing.loadEventEnd - timing.navigationStart
    },
    memory: getMemoryInfo(),
    resources: getResourceSummary()
  };
}

/**
 * Get memory information
 */
function getMemoryInfo() {
  if (!performance.memory) {
    return null;
  }

  return {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    usedPercentage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2)
  };
}

/**
 * Get resource loading summary
 */
function getResourceSummary() {
  if (!performance.getEntriesByType) {
    return null;
  }

  const resources = performance.getEntriesByType('resource');

  const summary = {
    total: resources.length,
    byType: {},
    totalSize: 0,
    totalDuration: 0
  };

  resources.forEach((resource) => {
    const type = resource.initiatorType;

    if (!summary.byType[type]) {
      summary.byType[type] = {
        count: 0,
        size: 0,
        duration: 0
      };
    }

    summary.byType[type].count++;
    summary.byType[type].size += resource.transferSize || 0;
    summary.byType[type].duration += resource.duration;

    summary.totalSize += resource.transferSize || 0;
    summary.totalDuration += resource.duration;
  });

  return summary;
}

/**
 * Monitor frame rate (FPS)
 */
export function monitorFrameRate(callback, duration = 5000) {
  let frameCount = 0;
  let lastTime = performance.now();
  let rafId;

  const countFrames = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= duration) {
      const fps = (frameCount / duration) * 1000;
      callback(fps);
      trackPerformance('FPS', fps);

      // Reset for next measurement
      frameCount = 0;
      lastTime = currentTime;
    }

    rafId = requestAnimationFrame(countFrames);
  };

  rafId = requestAnimationFrame(countFrames);

  // Return cleanup function
  return () => cancelAnimationFrame(rafId);
}

/**
 * Clear performance marks and measures
 */
export function clearPerformanceMarks() {
  if (performance.clearMarks) {
    performance.clearMarks();
  }
  if (performance.clearMeasures) {
    performance.clearMeasures();
  }
}

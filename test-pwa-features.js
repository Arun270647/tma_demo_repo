#!/usr/bin/env node

/**
 * PWA Features Automated Test Suite
 * Tests Badge API and Background Sync implementations
 */

const fs = require('fs');
const path = require('path');

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Helper functions
function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS', error: null });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function checkExport(content, exportName) {
  const exportRegex = new RegExp(`export\\s+(async\\s+)?function\\s+${exportName}|export\\s+{[^}]*${exportName}[^}]*}`);
  return exportRegex.test(content);
}

console.log('\n🧪 PWA Features Test Suite\n');
console.log('='.repeat(60));

// Test 1: File Structure
console.log('\n📁 File Structure Tests\n');

test('Badge helpers file exists', () => {
  assert(fileExists('frontend/src/utils/badgeHelpers.js'), 'badgeHelpers.js not found');
});

test('Sync queue file exists', () => {
  assert(fileExists('frontend/src/utils/syncQueue.js'), 'syncQueue.js not found');
});

test('Offline helpers file exists', () => {
  assert(fileExists('frontend/src/utils/offlineHelpers.js'), 'offlineHelpers.js not found');
});

test('Service worker file exists', () => {
  assert(fileExists('frontend/public/service-worker.js'), 'service-worker.js not found');
});

test('App.js file exists', () => {
  assert(fileExists('frontend/src/App.js'), 'App.js not found');
});

test('PWA Features Guide exists', () => {
  assert(fileExists('PWA-FEATURES-GUIDE.md'), 'PWA-FEATURES-GUIDE.md not found');
});

test('PWA Features Test Report exists', () => {
  assert(fileExists('PWA-FEATURES-TEST-REPORT.md'), 'PWA-FEATURES-TEST-REPORT.md not found');
});

// Test 2: Badge Helpers Exports
console.log('\n📛 Badge API Tests\n');

const badgeContent = readFile('frontend/src/utils/badgeHelpers.js');

test('Badge helpers exports isBadgeSupported', () => {
  assert(checkExport(badgeContent, 'isBadgeSupported'), 'isBadgeSupported not exported');
});

test('Badge helpers exports setBadgeCount', () => {
  assert(checkExport(badgeContent, 'setBadgeCount'), 'setBadgeCount not exported');
});

test('Badge helpers exports clearBadge', () => {
  assert(checkExport(badgeContent, 'clearBadge'), 'clearBadge not exported');
});

test('Badge helpers exports incrementBadge', () => {
  assert(checkExport(badgeContent, 'incrementBadge'), 'incrementBadge not exported');
});

test('Badge helpers exports decrementBadge', () => {
  assert(checkExport(badgeContent, 'decrementBadge'), 'decrementBadge not exported');
});

test('Badge helpers exports getBadgeCount', () => {
  assert(checkExport(badgeContent, 'getBadgeCount'), 'getBadgeCount not exported');
});

test('Badge helpers exports initializeBadge', () => {
  assert(checkExport(badgeContent, 'initializeBadge'), 'initializeBadge not exported');
});

test('Badge helpers exports setupBadgeAutoClearing', () => {
  assert(checkExport(badgeContent, 'setupBadgeAutoClearing'), 'setupBadgeAutoClearing not exported');
});

test('Badge helpers contains localStorage usage', () => {
  assert(badgeContent.includes('localStorage'), 'localStorage not used for persistence');
});

test('Badge helpers contains navigator.setAppBadge', () => {
  assert(badgeContent.includes('navigator.setAppBadge'), 'Badge API not used');
});

// Test 3: Sync Queue Exports
console.log('\n🔄 Background Sync Tests\n');

const syncContent = readFile('frontend/src/utils/syncQueue.js');

test('Sync queue exports isBackgroundSyncSupported', () => {
  assert(checkExport(syncContent, 'isBackgroundSyncSupported'), 'isBackgroundSyncSupported not exported');
});

test('Sync queue exports addToSyncQueue', () => {
  assert(checkExport(syncContent, 'addToSyncQueue'), 'addToSyncQueue not exported');
});

test('Sync queue exports getPendingItems', () => {
  assert(checkExport(syncContent, 'getPendingItems'), 'getPendingItems not exported');
});

test('Sync queue exports removeFromSyncQueue', () => {
  assert(checkExport(syncContent, 'removeFromSyncQueue'), 'removeFromSyncQueue not exported');
});

test('Sync queue exports processSyncQueue', () => {
  assert(checkExport(syncContent, 'processSyncQueue'), 'processSyncQueue not exported');
});

test('Sync queue exports getSyncQueueStats', () => {
  assert(checkExport(syncContent, 'getSyncQueueStats'), 'getSyncQueueStats not exported');
});

test('Sync queue exports triggerManualSync', () => {
  assert(checkExport(syncContent, 'triggerManualSync'), 'triggerManualSync not exported');
});

test('Sync queue exports setupAutoSync', () => {
  assert(checkExport(syncContent, 'setupAutoSync'), 'setupAutoSync not exported');
});

test('Sync queue uses IndexedDB', () => {
  assert(syncContent.includes('indexedDB.open'), 'IndexedDB not used');
});

test('Sync queue has retry logic', () => {
  assert(syncContent.includes('retryCount') && syncContent.includes('maxRetries'), 'Retry logic not implemented');
});

test('Sync queue registers background sync', () => {
  assert(syncContent.includes('registration.sync.register'), 'Background sync registration not found');
});

// Test 4: Offline Helpers Exports
console.log('\n📡 Offline Helpers Tests\n');

const offlineContent = readFile('frontend/src/utils/offlineHelpers.js');

test('Offline helpers exports isOnline', () => {
  assert(checkExport(offlineContent, 'isOnline'), 'isOnline not exported');
});

test('Offline helpers exports markAttendanceOffline', () => {
  assert(checkExport(offlineContent, 'markAttendanceOffline'), 'markAttendanceOffline not exported');
});

test('Offline helpers exports submitFormOffline', () => {
  assert(checkExport(offlineContent, 'submitFormOffline'), 'submitFormOffline not exported');
});

test('Offline helpers exports createTrainingPlanOffline', () => {
  assert(checkExport(offlineContent, 'createTrainingPlanOffline'), 'createTrainingPlanOffline not exported');
});

test('Offline helpers exports setupOfflineIndicators', () => {
  assert(checkExport(offlineContent, 'setupOfflineIndicators'), 'setupOfflineIndicators not exported');
});

test('Offline helpers imports addToSyncQueue', () => {
  assert(offlineContent.includes('addToSyncQueue'), 'addToSyncQueue not imported');
});

test('Offline helpers checks navigator.onLine', () => {
  assert(offlineContent.includes('navigator.onLine'), 'Online status check not found');
});

test('Offline helpers has offline indicator', () => {
  assert(offlineContent.includes('offline-indicator'), 'Offline indicator not implemented');
});

// Test 5: Service Worker Integration
console.log('\n⚙️  Service Worker Integration Tests\n');

const swContent = readFile('frontend/public/service-worker.js');

test('Service worker version updated to 1.3.0', () => {
  assert(swContent.includes('Version: 1.3.0'), 'Service worker version not updated');
});

test('Service worker cache updated to v4', () => {
  assert(swContent.includes('tma-cache-v4'), 'Cache version not updated');
});

test('Service worker has sync event listener', () => {
  assert(swContent.includes("addEventListener('sync'"), 'Sync event listener not found');
});

test('Service worker has processSyncQueue function', () => {
  assert(swContent.includes('function processSyncQueue'), 'processSyncQueue function not found');
});

test('Service worker has openSyncDatabase function', () => {
  assert(swContent.includes('function openSyncDatabase'), 'openSyncDatabase function not found');
});

test('Service worker increments badge on push', () => {
  assert(swContent.includes('incrementBadgeInServiceWorker'), 'Badge increment on push not found');
});

test('Service worker decrements badge on click', () => {
  assert(swContent.includes('decrementBadgeInServiceWorker'), 'Badge decrement on click not found');
});

test('Service worker has badge helper functions', () => {
  assert(
    swContent.includes('function incrementBadgeInServiceWorker') &&
    swContent.includes('function decrementBadgeInServiceWorker'),
    'Badge helper functions not found in service worker'
  );
});

test('Service worker opens IndexedDB for sync', () => {
  assert(swContent.includes("indexedDB.open('tma-sync-db'"), 'IndexedDB not opened in service worker');
});

test('Service worker creates sync-queue store', () => {
  assert(swContent.includes("'sync-queue'"), 'sync-queue store not created');
});

test('Service worker handles sync event tags', () => {
  assert(swContent.includes('event.tag'), 'Sync event tag handling not found');
});

// Test 6: App.js Integration
console.log('\n🚀 App.js Integration Tests\n');

const appContent = readFile('frontend/src/App.js');

test('App.js imports badge helpers', () => {
  assert(appContent.includes("from './utils/badgeHelpers'"), 'Badge helpers not imported');
});

test('App.js imports sync queue', () => {
  assert(appContent.includes("from './utils/syncQueue'"), 'Sync queue not imported');
});

test('App.js imports offline helpers', () => {
  assert(appContent.includes("from './utils/offlineHelpers'"), 'Offline helpers not imported');
});

test('App.js initializes badge', () => {
  assert(appContent.includes('initializeBadge'), 'Badge initialization not found');
});

test('App.js sets up badge auto-clearing', () => {
  assert(appContent.includes('setupBadgeAutoClearing'), 'Badge auto-clearing not set up');
});

test('App.js sets up auto-sync', () => {
  assert(appContent.includes('setupAutoSync'), 'Auto-sync not set up');
});

test('App.js sets up offline indicators', () => {
  assert(appContent.includes('setupOfflineIndicators'), 'Offline indicators not set up');
});

test('App.js listens for service worker messages', () => {
  assert(appContent.includes('handleServiceWorkerMessage'), 'Service worker message handler not found');
});

test('App.js handles INCREMENT_BADGE message', () => {
  assert(appContent.includes('INCREMENT_BADGE'), 'INCREMENT_BADGE handler not found');
});

test('App.js handles DECREMENT_BADGE message', () => {
  assert(appContent.includes('DECREMENT_BADGE'), 'DECREMENT_BADGE handler not found');
});

test('App.js handles SYNC_SUCCESS message', () => {
  assert(appContent.includes('SYNC_SUCCESS'), 'SYNC_SUCCESS handler not found');
});

test('App.js handles SYNC_FAILED message', () => {
  assert(appContent.includes('SYNC_FAILED'), 'SYNC_FAILED handler not found');
});

test('App.js has useEffect hook', () => {
  assert(appContent.includes('useEffect'), 'useEffect hook not found');
});

test('App.js cleans up event listeners', () => {
  assert(appContent.includes('removeEventListener'), 'Event listener cleanup not found');
});

// Test 7: Code Quality
console.log('\n✨ Code Quality Tests\n');

test('Badge helpers has error handling', () => {
  const tryCount = (badgeContent.match(/try\s*{/g) || []).length;
  assert(tryCount >= 5, 'Insufficient error handling in badge helpers');
});

test('Sync queue has error handling', () => {
  const tryCount = (syncContent.match(/try\s*{/g) || []).length;
  assert(tryCount >= 5, 'Insufficient error handling in sync queue');
});

test('Offline helpers has error handling', () => {
  const tryCount = (offlineContent.match(/try\s*{/g) || []).length;
  assert(tryCount >= 5, 'Insufficient error handling in offline helpers');
});

test('Badge helpers has browser support check', () => {
  assert(badgeContent.includes('setAppBadge') && badgeContent.includes('in navigator'), 'Browser support check missing');
});

test('Sync queue has browser support check', () => {
  assert(syncContent.includes('ServiceWorkerRegistration'), 'Background sync support check missing');
});

test('No console.error without try-catch', () => {
  const hasProperErrorHandling = badgeContent.includes('console.error') && badgeContent.includes('catch');
  assert(hasProperErrorHandling, 'console.error used without proper error handling');
});

// Test 8: Documentation
console.log('\n📚 Documentation Tests\n');

const guideContent = readFile('PWA-FEATURES-GUIDE.md');
const reportContent = readFile('PWA-FEATURES-TEST-REPORT.md');

test('Guide has Badge API section', () => {
  assert(guideContent.includes('# Badge API') || guideContent.includes('## Badge API'), 'Badge API section missing');
});

test('Guide has Background Sync section', () => {
  assert(guideContent.includes('Background Sync'), 'Background Sync section missing');
});

test('Guide has usage examples', () => {
  assert(guideContent.includes('```javascript'), 'Code examples missing from guide');
});

test('Guide has browser support table', () => {
  assert(guideContent.includes('Browser') && guideContent.includes('Support'), 'Browser support table missing');
});

test('Test report has test results', () => {
  assert(reportContent.includes('Test Results') || reportContent.includes('PASS'), 'Test results missing');
});

test('Test report has file list', () => {
  assert(reportContent.includes('badgeHelpers.js'), 'File list missing from report');
});

test('Guide has troubleshooting section', () => {
  assert(guideContent.includes('Troubleshooting') || guideContent.includes('troubleshooting'), 'Troubleshooting section missing');
});

// Test 9: Security & Performance
console.log('\n🔒 Security & Performance Tests\n');

test('No hardcoded API keys in badge helpers', () => {
  assert(!badgeContent.includes('sk_') && !badgeContent.includes('api_key'), 'Potential hardcoded API key found');
});

test('No hardcoded API keys in sync queue', () => {
  assert(!syncContent.includes('sk_') && !syncContent.includes('Bearer ey'), 'Potential hardcoded API key found');
});

test('Environment variables used in offline helpers', () => {
  assert(offlineContent.includes('process.env'), 'Environment variables not used');
});

test('Badge helpers has reasonable storage usage', () => {
  const fileSize = fs.statSync('frontend/src/utils/badgeHelpers.js').size;
  assert(fileSize < 10000, 'Badge helpers file too large (> 10KB)');
});

test('Sync queue has efficient IndexedDB usage', () => {
  assert(syncContent.includes('createIndex'), 'IndexedDB indexes not created for performance');
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results Summary\n');
console.log(`Total Tests: ${results.total}`);
console.log(`✓ Passed: ${results.passed}`);
console.log(`✗ Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:\n');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => {
      console.log(`  • ${t.name}`);
      console.log(`    ${t.error}`);
    });
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);

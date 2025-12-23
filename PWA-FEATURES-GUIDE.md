# 🚀 PWA Advanced Features Guide

## Table of Contents
1. [Badge API](#badge-api)
2. [Background Sync](#background-sync)
3. [Web Share API](#web-share-api)
4. [Implementation Examples](#implementation-examples)
5. [Browser Support](#browser-support)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 📛 Badge API

The Badge API allows displaying a notification count on the app icon, similar to native mobile apps.

### Features
- ✅ Show unread notification count on app icon
- ✅ Auto-increment when notifications received
- ✅ Auto-clear when app is opened/focused
- ✅ Persistent across sessions (localStorage)
- ✅ Service Worker integration

### Usage

#### Basic Functions

```javascript
import {
  isBadgeSupported,
  setBadgeCount,
  clearBadge,
  incrementBadge,
  decrementBadge,
  getBadgeCount
} from './utils/badgeHelpers';

// Check if supported
if (isBadgeSupported()) {
  // Set badge to specific count
  await setBadgeCount(5);

  // Increment badge
  await incrementBadge(); // Adds 1
  await incrementBadge(3); // Adds 3

  // Decrement badge
  await decrementBadge(); // Subtracts 1
  await decrementBadge(2); // Subtracts 2

  // Clear badge
  await clearBadge();

  // Get current count
  const count = getBadgeCount();
}
```

#### Automatic Badge Management

The Badge API is automatically integrated with:
- **Push Notifications**: Badge increments when notification received
- **Notification Clicks**: Badge decrements when notification clicked
- **App Focus**: Badge clears when app gains focus
- **Service Worker**: Syncs badge state across tabs

### How It Works

1. **On Push Notification**:
   - Service Worker increments badge
   - Count stored in localStorage
   - Badge shows on app icon

2. **On Notification Click**:
   - Service Worker decrements badge
   - Count updated in localStorage
   - Badge count reduced

3. **On App Focus**:
   - Badge automatically clears
   - User is viewing the app, no need for badge

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 81+ | ✅ Full | Desktop & Android |
| Edge 81+ | ✅ Full | Desktop only |
| Safari 16.4+ | ✅ Full | macOS only |
| Firefox | ❌ Not yet | In development |
| Opera 68+ | ✅ Full | Desktop & Android |

**Mobile**: Android (Chrome, Edge), iOS 16.4+ (Safari)

### Visual Example

```
Before Badge API:
[App Icon]

After Badge API with 5 notifications:
[App Icon with "5" badge]
```

---

## 🔄 Background Sync

Background Sync allows queuing actions when offline and automatically syncing when connection returns.

### Features
- ✅ Queue API calls when offline
- ✅ Auto-sync when connection restored
- ✅ Retry logic with exponential backoff
- ✅ IndexedDB persistent storage
- ✅ Multiple queue types (attendance, forms, messages, etc.)
- ✅ Status tracking (pending, completed, failed)
- ✅ Manual sync trigger

### Architecture

```
User Action (Offline)
       ↓
Add to Sync Queue (IndexedDB)
       ↓
Register Background Sync
       ↓
Connection Restored
       ↓
Service Worker triggers sync
       ↓
Process Queue Items
       ↓
Update Database
       ↓
Notify User (Success/Failure)
```

### Usage

#### 1. Mark Attendance Offline

```javascript
import { markAttendanceOffline } from './utils/offlineHelpers';

const attendanceData = {
  player_id: 'player-123',
  session_id: 'session-456',
  status: 'present',
  timestamp: new Date().toISOString()
};

const result = await markAttendanceOffline(attendanceData);

if (result.offline) {
  console.log('Queued for sync:', result.queued);
  // Show user: "Saved! Will sync when online"
} else if (result.success) {
  console.log('Saved online:', result.data);
  // Show user: "Attendance marked"
}
```

#### 2. Submit Form Offline

```javascript
import { submitFormOffline } from './utils/offlineHelpers';

const formData = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!'
};

const result = await submitFormOffline(
  'contact-form',
  formData,
  '/api/contact'
);

if (result.offline) {
  // Show user: "Form saved! Will submit when online"
}
```

#### 3. Create Training Plan Offline

```javascript
import { createTrainingPlanOffline } from './utils/offlineHelpers';

const planData = {
  name: 'Advanced Soccer Training',
  coach_id: 'coach-123',
  exercises: [...],
  duration: 90
};

const result = await createTrainingPlanOffline(planData);
```

#### 4. Generic API Call Offline

```javascript
import { apiCallOffline } from './utils/offlineHelpers';

const result = await apiCallOffline('custom-action', {
  key: 'value'
}, {
  endpoint: '/api/custom',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

#### 5. Manual Sync Trigger

```javascript
import { triggerManualSync } from './utils/syncQueue';

// Trigger sync manually (e.g., on button click)
const result = await triggerManualSync();

if (result.success) {
  console.log(`Synced ${result.successful} items`);
} else {
  console.log('Sync failed:', result.error);
}
```

#### 6. Get Queue Statistics

```javascript
import { getSyncQueueStats } from './utils/syncQueue';

const stats = await getSyncQueueStats();

console.log('Queue Stats:', stats);
// {
//   total: 10,
//   pending: 7,
//   completed: 2,
//   failed: 1,
//   retrying: 0
// }
```

### Offline Indicator

The app automatically shows an offline indicator when connection is lost:

```javascript
import { setupOfflineIndicators } from './utils/offlineHelpers';

// Already set up in App.js
setupOfflineIndicators();

// Shows orange banner: "📡 Offline - Changes will sync when connection returns"
```

### Sync Queue Management

#### Add to Queue

```javascript
import { addToSyncQueue } from './utils/syncQueue';

await addToSyncQueue('attendance', {
  player_id: 'player-123',
  status: 'present'
}, {
  endpoint: '/api/attendance',
  method: 'POST',
  maxRetries: 3
});
```

#### Get Pending Items

```javascript
import { getPendingItems } from './utils/syncQueue';

const pendingAttendance = await getPendingItems('attendance');
const allPending = await getPendingItems(); // All types
```

#### Clear Completed Items

```javascript
import { clearCompletedItems } from './utils/syncQueue';

const cleared = await clearCompletedItems();
console.log(`Cleared ${cleared} completed items`);
```

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 49+ | ✅ Full | Desktop & Android |
| Edge 79+ | ✅ Full | Desktop & Android |
| Safari | ❌ Not yet | May support in future |
| Firefox | ⚠️ Partial | Background Sync in development |
| Opera 36+ | ✅ Full | Desktop & Android |

**Fallback**: When Background Sync not supported, manual sync triggers on connection restore.

### IndexedDB Structure

```javascript
Database: tma-sync-db
Store: sync-queue

Item Structure:
{
  id: 1, // Auto-increment
  type: 'attendance', // Queue type
  data: { ... }, // Actual data to sync
  options: { endpoint, method, headers },
  timestamp: 1234567890,
  status: 'pending', // pending, completed, failed, retry
  retryCount: 0,
  maxRetries: 3,
  lastError: null
}
```

---

## 🔗 Web Share API

The Web Share API enables native sharing of content to social media, messaging apps, email, and more.

### Features
- ✅ Native share dialog (system UI)
- ✅ Share to any app on device
- ✅ Share text, links, and files
- ✅ Automatic fallback to clipboard
- ✅ Platform-specific sharing (WhatsApp, Email, etc.)
- ✅ Share images and PDFs

### Usage

#### Basic Sharing

```javascript
import {
  isWebShareSupported,
  share,
  shareWithFallback
} from './utils/shareHelpers';

// Check if supported
if (isWebShareSupported()) {
  console.log('Web Share API is supported!');
}

// Basic share
await share({
  title: 'Check this out!',
  text: 'This is amazing content',
  url: 'https://example.com'
});

// Share with clipboard fallback
await shareWithFallback({
  title: 'My Content',
  text: 'Check out this content!',
  url: window.location.href
});
```

#### Share Player Stats

```javascript
import { sharePlayerStats } from './utils/shareHelpers';

const playerData = {
  id: 'player-123',
  name: 'John Doe',
  period: 'November 2025',
  stats: {
    goals: 15,
    assists: 8,
    attendance: 95,
    rating: 4.5
  }
};

await sharePlayerStats(playerData);
```

#### Share Performance Report

```javascript
import { sharePerformanceReport } from './utils/shareHelpers';

const reportData = {
  playerName: 'John Doe',
  reportType: 'Monthly Performance',
  summary: 'Outstanding performance with 15 goals and 95% attendance.',
  url: '/reports/monthly-123'
};

await sharePerformanceReport(reportData);
```

#### Share Training Session

```javascript
import { shareTrainingSession } from './utils/shareHelpers';

const sessionData = {
  name: 'Advanced Dribbling',
  date: '2025-12-20',
  time: '5:00 PM',
  location: 'Main Stadium',
  description: 'Focus on ball control and speed dribbling'
};

await shareTrainingSession(sessionData);
```

#### Share Achievement

```javascript
import { shareAchievement } from './utils/shareHelpers';

const achievementData = {
  playerName: 'John Doe',
  achievement: 'Hat-trick Hero!',
  description: 'Scored 3 goals in a single match',
  date: '2025-12-14'
};

await shareAchievement(achievementData);
```

#### Share Image/Screenshot

```javascript
import { shareImage } from './utils/shareHelpers';

// From file input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await shareImage(file, 'Performance Chart', 'Check out my progress!');

// From canvas
const canvas = document.querySelector('canvas');
canvas.toBlob(async (blob) => {
  await shareImage(blob, 'Stats Chart');
});
```

#### Share PDF Report

```javascript
import { sharePDF } from './utils/shareHelpers';

// Generate PDF blob (using library like jsPDF)
const pdfBlob = generatePDFReport();

await sharePDF(pdfBlob, 'monthly-report.pdf', 'Monthly Performance Report');
```

#### Using ShareButton Component

```javascript
import ShareButton from './components/ShareButton';

function PlayerProfile() {
  const shareData = {
    title: 'John Doe - Player Profile',
    text: 'Check out John\'s amazing stats!',
    url: window.location.href
  };

  return (
    <div>
      <h1>Player Profile</h1>

      {/* Simple share button */}
      <ShareButton shareData={shareData} />

      {/* With platform options */}
      <ShareButton
        shareData={shareData}
        buttonText="Share Profile"
        showPlatforms={true}
        platforms={['whatsapp', 'telegram', 'email']}
      />
    </div>
  );
}
```

#### Platform-Specific Sharing

```javascript
import { shareOnPlatform, getPlatformShareUrl } from './utils/shareHelpers';

const shareData = {
  title: 'Amazing Performance!',
  text: 'John scored 15 goals this month!',
  url: '/player/john-doe'
};

// Share to specific platform
shareOnPlatform('whatsapp', shareData);
shareOnPlatform('telegram', shareData);
shareOnPlatform('twitter', shareData);
shareOnPlatform('email', shareData);

// Get platform URL for custom implementation
const whatsappUrl = getPlatformShareUrl('whatsapp', shareData);
window.open(whatsappUrl, '_blank');
```

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 89+ | ✅ Full | Desktop & Android |
| Edge 89+ | ✅ Full | Desktop & Android |
| Safari 12.1+ | ✅ Full | iOS & macOS |
| Firefox | ❌ Not yet | Planned for future |
| Opera 76+ | ✅ Full | Desktop & Android |

**File Sharing (Level 2):**
- Chrome 89+ (Desktop & Android)
- Safari 15+ (iOS & macOS)
- Edge 89+

**Mobile Support:** Excellent on iOS and Android

### Automatic Fallbacks

When Web Share API is not supported:
1. **Copy to Clipboard** - Text copied automatically
2. **Platform URLs** - Direct links to WhatsApp, Telegram, etc.
3. **Email Links** - `mailto:` links for email sharing

```javascript
import { shareWithFallback } from './utils/shareHelpers';

// Automatically handles fallback
await shareWithFallback(shareData);
// Desktop without share: copies to clipboard
// Mobile: native share dialog
```

### Best Practices

1. **Always check support**:
   ```javascript
   if (isWebShareSupported()) {
     // Use native share
   } else {
     // Show platform buttons
   }
   ```

2. **Provide meaningful content**:
   - Clear titles
   - Descriptive text
   - Working URLs

3. **Handle errors gracefully**:
   ```javascript
   try {
     await share(data);
   } catch (error) {
     if (error.name === 'AbortError') {
       // User cancelled - do nothing
     } else {
       // Show error message
     }
   }
   ```

4. **Use fallbacks**:
   - Always use `shareWithFallback()` for best UX
   - Provide platform-specific buttons on desktop

5. **Optimize for mobile**:
   - Mobile users have more share targets
   - Test on real devices
   - Keep share text concise

### Share Data Format

```javascript
{
  title: 'String',      // Share title (optional)
  text: 'String',       // Share text (optional)
  url: 'String',        // Share URL (optional)
  files: [File]         // Files to share (optional, Level 2)
}
```

**Requirements:**
- At least one of: title, text, url, or files
- URLs must be same-origin or HTTPS
- Files must be shareable types (images, PDFs, etc.)

---

## 💡 Implementation Examples

### Example 1: Attendance Tracker with Offline Support

```javascript
// In AttendanceTracker.js
import { markAttendanceOffline } from '../utils/offlineHelpers';
import { isOnline } from '../utils/offlineHelpers';

const AttendanceTracker = () => {
  const handleMarkAttendance = async (playerId, status) => {
    const result = await markAttendanceOffline({
      player_id: playerId,
      session_id: currentSession.id,
      status: status,
      timestamp: new Date().toISOString()
    });

    if (result.offline) {
      showNotification('Saved offline! Will sync when online ⏳', 'info');
    } else if (result.success) {
      showNotification('Attendance marked ✓', 'success');
    } else {
      showNotification('Failed to mark attendance', 'error');
    }
  };

  return (
    <div>
      {!isOnline() && (
        <div className="offline-banner">
          📡 Offline Mode - Changes will sync automatically
        </div>
      )}
      {/* Attendance UI */}
    </div>
  );
};
```

### Example 2: Form Submission with Retry Logic

```javascript
// In ContactForm.js
import { submitFormOffline } from '../utils/offlineHelpers';

const ContactForm = () => {
  const handleSubmit = async (formData) => {
    setSubmitting(true);

    const result = await submitFormOffline(
      'contact-form',
      formData,
      '/api/contact'
    );

    if (result.offline) {
      setMessage('Form saved! Will submit when you\'re back online');
      setMessageType('info');
    } else if (result.success) {
      setMessage('Form submitted successfully!');
      setMessageType('success');
      resetForm();
    } else if (result.queued) {
      setMessage('Failed to submit, but queued for retry');
      setMessageType('warning');
    }

    setSubmitting(false);
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Example 3: Sync Status Indicator

```javascript
// In SyncStatus.js
import { getSyncQueueStats } from '../utils/syncQueue';
import { triggerManualSync } from '../utils/syncQueue';

const SyncStatus = () => {
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const queueStats = await getSyncQueueStats();
      setStats(queueStats);
    };

    loadStats();
    const interval = setInterval(loadStats, 5000); // Update every 5s

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    const result = await triggerManualSync();
    setSyncing(false);

    if (result.success) {
      alert(`Synced ${result.successful} items!`);
    }
  };

  return (
    <div className="sync-status">
      {stats && stats.pending > 0 && (
        <div>
          ⏳ {stats.pending} items pending sync
          <button onClick={handleManualSync} disabled={syncing}>
            Sync Now
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🧪 Testing

### Testing Badge API

#### Test 1: Badge Increment
1. Open app in Chrome/Edge
2. Send test notification: `await sendTestNotification(userId)`
3. **Expected**: Badge shows "1" on app icon
4. Send another: badge shows "2"

#### Test 2: Badge Decrement
1. Badge shows "3"
2. Click a notification
3. **Expected**: Badge shows "2"

#### Test 3: Badge Clear on Focus
1. Badge shows "5"
2. Click app icon to open/focus app
3. **Expected**: Badge clears (shows nothing)

#### Test 4: Badge Persistence
1. Set badge to 3
2. Close tab
3. Reopen app
4. **Expected**: Badge still shows "3"

### Testing Background Sync

#### Test 1: Offline Attendance Marking
1. Turn off network (DevTools → Network → Offline)
2. Mark attendance for a player
3. **Expected**: Orange offline banner appears
4. **Expected**: Success message: "Saved offline"
5. Check IndexedDB: item in sync-queue with status='pending'
6. Turn network back on
7. **Expected**: Auto-sync triggers
8. **Expected**: Item removed from queue
9. **Expected**: Data appears in database

#### Test 2: Manual Sync Trigger
1. Go offline
2. Submit 3 forms
3. Check queue stats: 3 pending
4. Go back online
5. Click "Sync Now" button
6. **Expected**: All 3 items synced
7. **Expected**: Queue stats: 0 pending, 3 completed

#### Test 3: Retry Logic
1. Go offline
2. Submit form
3. Modify endpoint to invalid URL
4. Go online
5. **Expected**: Sync fails, item marked as 'retry'
6. **Expected**: Retry attempts (up to maxRetries)
7. **Expected**: After 3 retries, status='failed'

#### Test 4: Service Worker Sync
1. Go offline
2. Mark attendance
3. Close all app tabs
4. Go back online
5. **Expected**: Service Worker triggers sync in background
6. **Expected**: Data synced even without open tab

---

## 🔧 Troubleshooting

### Badge API Issues

**Issue**: Badge not showing

**Solutions**:
1. Check browser support: `isBadgeSupported()`
2. Check browser console for errors
3. Ensure app is installed (PWA)
4. Check localStorage for `tma_badge_count`

**Issue**: Badge count incorrect

**Solutions**:
1. Clear badge: `clearBadge()`
2. Set manually: `setBadgeCount(0)`
3. Clear localStorage: `localStorage.removeItem('tma_badge_count')`

### Background Sync Issues

**Issue**: Items not syncing

**Solutions**:
1. Check if online: `navigator.onLine`
2. Check queue: `getPendingItems()`
3. Check IndexedDB: Application → IndexedDB → tma-sync-db
4. Trigger manual sync: `triggerManualSync()`
5. Check service worker console for errors

**Issue**: Service Worker not registering sync

**Solutions**:
1. Check support: `isBackgroundSyncSupported()`
2. Check service worker registration: `navigator.serviceWorker.ready`
3. Re-register service worker
4. Check browser console for sync errors

**Issue**: Queue items stuck as "pending"

**Solutions**:
1. Check endpoint URL is correct
2. Check API is accessible
3. Check authentication headers
4. Manually retry: `processSyncQueue()`
5. Clear failed items: `clearCompletedItems()`

**Issue**: Offline indicator not showing

**Solutions**:
1. Check `setupOfflineIndicators()` is called
2. Check network state: `navigator.onLine`
3. Check console for errors
4. Manually trigger: `showOfflineIndicator()`

---

## 📊 Performance Considerations

### Badge API
- **Storage**: ~50 bytes in localStorage
- **Performance**: Instant (< 1ms)
- **Battery Impact**: Negligible

### Background Sync
- **Storage**: Depends on queue size (typically < 1MB)
- **Performance**:
  - Queue add: < 10ms
  - Sync processing: Depends on API response time
- **Battery Impact**: Minimal (syncs only when online)
- **Network**: Efficient retry logic prevents excessive requests

---

## 🎯 Best Practices

### Badge API
1. Clear badge when app gains focus
2. Don't set badge > 99 (shows as "99+")
3. Use for notifications only (not arbitrary numbers)
4. Provide way to clear badge manually

### Background Sync
1. Show clear offline indicators
2. Give user feedback when queuing
3. Implement reasonable retry limits (3-5)
4. Clean up old completed items regularly
5. Provide manual sync option
6. Handle conflicts gracefully
7. Validate data before queuing
8. Show sync status to users

---

**Created**: 2025-12-14
**Version**: 1.0
**Features**: Badge API, Background Sync
**Status**: ✅ Fully Implemented

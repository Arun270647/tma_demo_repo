# 🔔 Push Notifications Implementation Guide

## 📚 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [How to Use](#how-to-use)
5. [Notification Types](#notification-types)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Push notifications have been fully implemented for Track My Academy using:
- **Frontend**: React PWA with Web Push API
- **Backend**: Supabase Edge Functions with web-push
- **Database**: Supabase PostgreSQL for subscription storage

**Features:**
- ✅ Permission request UI
- ✅ Subscribe/unsubscribe functionality
- ✅ Rich notifications with actions
- ✅ Multiple notification types
- ✅ Offline support via Service Worker
- ✅ Automatic cleanup of invalid subscriptions

---

## 🏗️ Architecture

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ 1. Grants Permission
       │ 2. Creates Subscription
       ▼
┌─────────────────┐
│  NotificationPermission  │
│     Component   │
└──────┬──────────┘
       │ 3. Saves to DB
       ▼
┌──────────────────┐
│ Supabase Database│
│ push_subscriptions│
└──────┬───────────┘
       │
       │ 4. Trigger Event
       │ (e.g., attendance marked)
       ▼
┌──────────────────────┐
│   Backend Code       │
│ (notificationHelpers)│
└──────┬───────────────┘
       │ 5. Calls Edge Function
       ▼
┌──────────────────────────┐
│  Supabase Edge Function  │
│   send-notification      │
└──────┬───────────────────┘
       │ 6. Sends to Push Service
       ▼
┌──────────────────┐
│  Browser Push    │
│    Service       │
│ (Google/Mozilla) │
└──────┬───────────┘
       │ 7. Delivers to Device
       ▼
┌──────────────────┐
│  Service Worker  │
│  (Displays notif)│
└──────────────────┘
```

---

## 🚀 Setup Instructions

### **Step 1: Database Setup**

Run the SQL script in Supabase SQL Editor (see `PUSH-NOTIFICATIONS-SETUP.md`):

```sql
-- Creates push_subscriptions table
-- Creates notification_events table (optional)
-- Sets up RLS policies
```

### **Step 2: Environment Variables**

#### Frontend `.env`
Already created at `/frontend/.env`:
```env
REACT_APP_VAPID_PUBLIC_KEY=BPMnDK67juwxDLMSj1WXEdDd6NcVvuzNSCJq5NNil9WT4vvvgZqVVMsDpwh7xgYHeUxIEDCUkVsdTTUQOawud2o
```

#### Supabase Edge Function Secrets
In Supabase Dashboard → Settings → Edge Functions → Secrets:
```env
VAPID_PUBLIC_KEY=BPMnDK67juwxDLMSj1WXEdDd6NcVvuzNSCJq5NNil9WT4vvvgZqVVMsDpwh7xgYHeUxIEDCUkVsdTTUQOawud2o
```

### **Step 3: Deploy Edge Function**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy send-notification
```

### **Step 4: Rebuild Frontend**

```bash
cd frontend
npm install
npm run build
```

---

## 💡 How to Use

### **1. User Subscribes**

When user logs in, they'll see a notification banner:
```jsx
<NotificationPermission />
```

- Banner appears after 3 seconds
- User clicks "Enable Notifications"
- Permission requested
- Subscription saved to database

### **2. Send Notifications**

Use the helper functions in your code:

```javascript
import { notifyAttendanceMarked } from '../utils/notificationHelpers';

// When marking attendance
await notifyAttendanceMarked(player.id, 'Morning Training', 'present');
```

### **3. Available Helper Functions**

```javascript
// Attendance
notifyAttendanceMarked(playerId, sessionName, status)

// Training Plans
notifyTrainingPlanApproved(coachId, planName)
notifyTrainingPlanFlagged(coachId, planName, reason)

// Player/Coach Assignment
notifyPlayerAssigned(coachId, playerName)
notifyPlayerAssignedToCoach(playerId, coachName)

// Performance
notifyPerformanceReport(playerId, reportType)

// Messages
notifyNewMessage(userId, senderName, preview)

// Goals
notifyGoalAchieved(playerId, goalName)

// Reminders
notifySessionReminder(userId, sessionName, timeUntil)

// Batch notifications
notifyBatch(userIds[], title, body, url, type)

// Custom
sendCustomNotification(userId, title, body, options)
```

---

## 📋 Notification Types

| Type | Icon | Actions | URL |
|------|------|---------|-----|
| **Attendance** | 📋 | View Details | `/player-dashboard` |
| **Training Plan** | 📝 | View Plan | `/coach/dashboard` |
| **Message** | 💬 | Reply, View | `/messages` |
| **Performance** | 📊 | View | `/player-dashboard` |
| **Goal** | 🎯 | View | `/player-dashboard` |
| **Reminder** | ⏰ | View | `/schedule` |

---

## 🧪 Testing

### **Test in Development:**

1. **Start development server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Open browser:** http://localhost:3000

3. **Enable notifications:**
   - Log in as a user
   - Click "Enable Notifications" in the banner
   - Grant permission

4. **Send test notification:**
   ```javascript
   import { sendTestNotification } from '../utils/pushNotifications';

   // In console or button click
   await sendTestNotification(user.id);
   ```

### **Test Notification Types:**

```javascript
// Test attendance notification
await notifyAttendanceMarked('user-id', 'Morning Training', 'present');

// Test training plan notification
await notifyTrainingPlanApproved('coach-id', 'Advanced Soccer');

// Test message notification
await notifyNewMessage('user-id', 'Coach John', 'Great job today!');
```

---

## 🌐 Deployment

### **Production Requirements:**

1. ✅ **HTTPS Required** (PWA requirement)
2. ✅ Service Worker deployed
3. ✅ Edge Function deployed
4. ✅ Environment variables set
5. ✅ Database tables created

### **Deployment Checklist:**

- [ ] Run SQL scripts in production Supabase
- [ ] Add secrets to Supabase Edge Functions
- [ ] Deploy Edge Function: `supabase functions deploy send-notification`
- [ ] Build frontend: `npm run build`
- [ ] Deploy frontend to hosting (Vercel, Netlify, etc.)
- [ ] Test notifications in production

---

## 🔧 Troubleshooting

### **Issue: Permission Denied**

**Solution:** User must manually reset permission in browser:
- Chrome: Settings → Privacy → Site Settings → Notifications
- Firefox: Preferences → Privacy → Permissions → Notifications

### **Issue: Notifications Not Received**

**Check:**
1. Is user subscribed? (Check `push_subscriptions` table)
2. Is Edge Function deployed?
3. Are VAPID keys correct in secrets?
4. Check browser console for errors
5. Check service worker is registered: `chrome://serviceworker-internals/`

### **Issue: Invalid Subscription**

**Automatic cleanup:** Invalid subscriptions are automatically removed when they return 410 Gone.

### **Issue: Notifications on Wrong Tab**

**Solution:** Service worker will focus existing tab or open new one.

---

## 📊 Database Queries

### **Check Subscriptions:**
```sql
SELECT * FROM push_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

### **Count Active Subscriptions:**
```sql
SELECT user_id, COUNT(*) as subscription_count
FROM push_subscriptions
GROUP BY user_id;
```

### **Remove Old Subscriptions:**
```sql
DELETE FROM push_subscriptions
WHERE updated_at < NOW() - INTERVAL '90 days';
```

---

## 🎓 Usage Examples

### **Example 1: Notify on Attendance**

In `AttendanceTracker.js`:

```javascript
import { notifyAttendanceMarked } from '../utils/notificationHelpers';

const markAttendance = async (playerId, status) => {
  // Mark attendance in database
  const { error } = await supabase
    .from('attendance')
    .insert({ player_id: playerId, status: status });

  if (!error) {
    // Send notification
    await notifyAttendanceMarked(
      playerId,
      'Morning Training Session',
      status
    );
  }
};
```

### **Example 2: Notify on Training Plan Approval**

In `TrainingPlans.js`:

```javascript
import { notifyTrainingPlanApproved, notifyTrainingPlanFlagged } from '../utils/notificationHelpers';

const handleReview = async (planId, action, coachId, planName) => {
  // Update plan status
  const { error } = await supabase
    .from('training_plans')
    .update({ status: action })
    .eq('id', planId);

  if (!error) {
    // Send notification based on action
    if (action === 'approved') {
      await notifyTrainingPlanApproved(coachId, planName);
    } else if (action === 'flagged') {
      await notifyTrainingPlanFlagged(coachId, planName, 'Requires revision');
    }
  }
};
```

### **Example 3: Batch Notification**

Notify all players in a batch:

```javascript
import { notifyBatch } from '../utils/notificationHelpers';

const notifyBatchCancellation = async (batchId) => {
  // Get all player IDs in batch
  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('batch_id', batchId);

  const playerIds = players.map(p => p.id);

  // Send notification to all
  await notifyBatch(
    playerIds,
    'Session Cancelled ⚠️',
    'Today\'s training session has been cancelled',
    '/schedule',
    'cancellation'
  );
};
```

---

## 🔐 Security

- ✅ VAPID private key stored in Supabase secrets (not exposed)
- ✅ Row Level Security (RLS) on `push_subscriptions` table
- ✅ Users can only access their own subscriptions
- ✅ Service role key required for Edge Function
- ✅ CORS headers properly configured

---

## 📈 Future Enhancements

- [ ] Add notification preferences (user can choose which types to receive)
- [ ] Add quiet hours (don't send notifications at night)
- [ ] Add notification history in UI
- [ ] Add rich media (images in notifications)
- [ ] Add notification scheduling
- [ ] Add analytics (track open rates)

---

**Created:** 2025-12-14
**Status:** ✅ Fully Implemented and Ready for Use

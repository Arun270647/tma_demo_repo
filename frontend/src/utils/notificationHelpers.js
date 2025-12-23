/**
 * Notification Helper Functions
 * Easy-to-use functions to trigger push notifications for various events
 */

import { supabase } from '../supabaseClient';

/**
 * Send notification via Supabase Edge Function
 */
async function sendNotification(userId, notification) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userId: userId,
        notification: notification,
      },
    });

    if (error) {
      console.error('Error sending notification:', error);
      return false;
    }

    console.log('Notification sent:', data);
    return true;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return false;
  }
}

/**
 * Send notification to multiple users
 */
async function sendNotificationToMultiple(userIds, notification) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userIds: userIds,
        notification: notification,
      },
    });

    if (error) {
      console.error('Error sending notifications:', error);
      return false;
    }

    console.log('Notifications sent:', data);
    return true;
  } catch (error) {
    console.error('Error in sendNotificationToMultiple:', error);
    return false;
  }
}

// ===== NOTIFICATION TRIGGERS =====

/**
 * Notify player when attendance is marked
 */
export async function notifyAttendanceMarked(playerId, sessionName, status) {
  const statusEmoji = status === 'present' ? '✅' : status === 'absent' ? '❌' : '⏰';

  return sendNotification(playerId, {
    title: `Attendance Recorded ${statusEmoji}`,
    body: `Your attendance has been marked as ${status} for ${sessionName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/player-dashboard',
    type: 'attendance',
    data: {
      sessionName,
      status,
    },
  });
}

/**
 * Notify coach when training plan is approved
 */
export async function notifyTrainingPlanApproved(coachId, planName) {
  return sendNotification(coachId, {
    title: 'Training Plan Approved ✅',
    body: `Your training plan "${planName}" has been approved`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/coach/dashboard',
    type: 'training_plan',
    data: {
      planName,
      status: 'approved',
    },
  });
}

/**
 * Notify coach when training plan is flagged
 */
export async function notifyTrainingPlanFlagged(coachId, planName, reason) {
  return sendNotification(coachId, {
    title: 'Training Plan Needs Review ⚠️',
    body: `Your training plan "${planName}" requires attention: ${reason}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/coach/dashboard',
    type: 'training_plan',
    data: {
      planName,
      status: 'flagged',
      reason,
    },
  });
}

/**
 * Notify coach when player is assigned
 */
export async function notifyPlayerAssigned(coachId, playerName) {
  return sendNotification(coachId, {
    title: 'New Player Assigned 👤',
    body: `${playerName} has been assigned to you`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/coach/dashboard',
    type: 'player_assignment',
    data: {
      playerName,
    },
  });
}

/**
 * Notify player when assigned to coach
 */
export async function notifyPlayerAssignedToCoach(playerId, coachName) {
  return sendNotification(playerId, {
    title: 'Coach Assigned 👨‍🏫',
    body: `You have been assigned to coach ${coachName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/player-dashboard',
    type: 'coach_assignment',
    data: {
      coachName,
    },
  });
}

/**
 * Notify player about new performance report
 */
export async function notifyPerformanceReport(playerId, reportType) {
  return sendNotification(playerId, {
    title: 'New Performance Report 📊',
    body: `Your latest ${reportType} performance report is available`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/player-dashboard',
    type: 'performance',
    data: {
      reportType,
    },
  });
}

/**
 * Notify user about new message
 */
export async function notifyNewMessage(userId, senderName, preview) {
  return sendNotification(userId, {
    title: `New Message from ${senderName} 💬`,
    body: preview,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/messages',
    type: 'message',
    data: {
      senderName,
      preview,
    },
  });
}

/**
 * Notify player when goal is achieved
 */
export async function notifyGoalAchieved(playerId, goalName) {
  return sendNotification(playerId, {
    title: 'Goal Achieved! 🎯',
    body: `Congratulations on reaching your goal: ${goalName}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/player-dashboard',
    type: 'goal',
    data: {
      goalName,
    },
  });
}

/**
 * Notify user about upcoming session
 */
export async function notifySessionReminder(userId, sessionName, timeUntil) {
  return sendNotification(userId, {
    title: 'Upcoming Session ⏰',
    body: `Reminder: ${sessionName} starts in ${timeUntil}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/schedule',
    type: 'reminder',
    data: {
      sessionName,
      timeUntil,
    },
  });
}

/**
 * Notify multiple users (e.g., all players in a batch)
 */
export async function notifyBatch(userIds, title, body, url = '/', type = 'general') {
  return sendNotificationToMultiple(userIds, {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url,
    type,
  });
}

/**
 * Notify academy about important event
 */
export async function notifyAcademy(academyAdminId, title, body, url = '/academy') {
  return sendNotification(academyAdminId, {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url,
    type: 'academy',
  });
}

/**
 * Send custom notification
 */
export async function sendCustomNotification(userId, title, body, options = {}) {
  return sendNotification(userId, {
    title,
    body,
    icon: options.icon || '/icons/icon-192x192.png',
    badge: options.badge || '/icons/icon-72x72.png',
    url: options.url || '/',
    type: options.type || 'custom',
    data: options.data || {},
  });
}

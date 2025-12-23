/**
 * Offline Operation Helpers
 * Provides easy-to-use functions for offline-capable operations
 */

import { addToSyncQueue, isBackgroundSyncSupported } from './syncQueue';
import { supabase } from '../supabaseClient';

/**
 * Check if device is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Mark attendance with offline support
 */
export async function markAttendanceOffline(attendanceData) {
  if (isOnline()) {
    // Online - send directly
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData);

      if (error) throw error;

      console.log('Attendance marked (online):', data);
      return { success: true, data, offline: false };
    } catch (error) {
      console.error('Error marking attendance:', error);

      // Failed online - queue for sync
      await addToSyncQueue('attendance', attendanceData, {
        endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/attendance`,
        method: 'POST',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        }
      });

      return { success: false, error, queued: true };
    }
  } else {
    // Offline - queue for sync
    await addToSyncQueue('attendance', attendanceData, {
      endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/attendance`,
      method: 'POST',
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
      }
    });

    console.log('Attendance queued for sync (offline)');
    return { success: true, offline: true, queued: true };
  }
}

/**
 * Submit form with offline support
 */
export async function submitFormOffline(formType, formData, endpoint) {
  if (isOnline()) {
    // Online - send directly
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Form submitted (online): ${formType}`, data);
      return { success: true, data, offline: false };
    } catch (error) {
      console.error(`Error submitting form (${formType}):`, error);

      // Failed online - queue for sync
      await addToSyncQueue(formType, formData, {
        endpoint: endpoint,
        method: 'POST'
      });

      return { success: false, error, queued: true };
    }
  } else {
    // Offline - queue for sync
    await addToSyncQueue(formType, formData, {
      endpoint: endpoint,
      method: 'POST'
    });

    console.log(`Form queued for sync (offline): ${formType}`);
    return { success: true, offline: true, queued: true };
  }
}

/**
 * Create training plan with offline support
 */
export async function createTrainingPlanOffline(planData) {
  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .insert(planData);

      if (error) throw error;

      console.log('Training plan created (online):', data);
      return { success: true, data, offline: false };
    } catch (error) {
      console.error('Error creating training plan:', error);

      await addToSyncQueue('training-plan', planData, {
        endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/training_plans`,
        method: 'POST',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        }
      });

      return { success: false, error, queued: true };
    }
  } else {
    await addToSyncQueue('training-plan', planData, {
      endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/training_plans`,
      method: 'POST',
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
      }
    });

    console.log('Training plan queued for sync (offline)');
    return { success: true, offline: true, queued: true };
  }
}

/**
 * Update performance data with offline support
 */
export async function updatePerformanceOffline(performanceData) {
  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('performance')
        .upsert(performanceData);

      if (error) throw error;

      console.log('Performance updated (online):', data);
      return { success: true, data, offline: false };
    } catch (error) {
      console.error('Error updating performance:', error);

      await addToSyncQueue('performance-update', performanceData, {
        endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/performance`,
        method: 'POST',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        }
      });

      return { success: false, error, queued: true };
    }
  } else {
    await addToSyncQueue('performance-update', performanceData, {
      endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/performance`,
      method: 'POST',
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      }
    });

    console.log('Performance update queued for sync (offline)');
    return { success: true, offline: true, queued: true };
  }
}

/**
 * Send message with offline support
 */
export async function sendMessageOffline(messageData) {
  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      console.log('Message sent (online):', data);
      return { success: true, data, offline: false };
    } catch (error) {
      console.error('Error sending message:', error);

      await addToSyncQueue('message', messageData, {
        endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/messages`,
        method: 'POST',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        }
      });

      return { success: false, error, queued: true };
    }
  } else {
    await addToSyncQueue('message', messageData, {
      endpoint: `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/messages`,
      method: 'POST',
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
      }
    });

    console.log('Message queued for sync (offline)');
    return { success: true, offline: true, queued: true };
  }
}

/**
 * Generic offline-capable API call
 */
export async function apiCallOffline(syncType, data, options) {
  if (isOnline()) {
    try {
      const response = await fetch(options.endpoint, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(`API call successful (online): ${syncType}`, responseData);
      return { success: true, data: responseData, offline: false };
    } catch (error) {
      console.error(`API call failed (${syncType}):`, error);

      await addToSyncQueue(syncType, data, options);
      return { success: false, error, queued: true };
    }
  } else {
    await addToSyncQueue(syncType, data, options);
    console.log(`API call queued for sync (offline): ${syncType}`);
    return { success: true, offline: true, queued: true };
  }
}

/**
 * Show offline indicator to user
 */
export function showOfflineIndicator() {
  if (!isOnline()) {
    // Create offline indicator if it doesn't exist
    if (!document.getElementById('offline-indicator')) {
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = '📡 Offline - Changes will sync when connection returns';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: white;
        padding: 8px 16px;
        text-align: center;
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
      `;
      document.body.appendChild(indicator);
    }
  }
}

/**
 * Hide offline indicator
 */
export function hideOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Setup offline/online event listeners
 */
export function setupOfflineIndicators() {
  window.addEventListener('offline', () => {
    console.log('Device went offline');
    showOfflineIndicator();
  });

  window.addEventListener('online', () => {
    console.log('Device came online');
    hideOfflineIndicator();
  });

  // Check initial state
  if (!isOnline()) {
    showOfflineIndicator();
  }
}

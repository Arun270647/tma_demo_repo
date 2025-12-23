/**
 * Push Notification Utilities
 * Handles web push subscription management and communication with Supabase
 */

import { supabase } from '../supabaseClient';

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check current notification permission
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(userId) {
  try {
    // Check if supported
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    // Request permission if not granted
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // If no subscription, create one
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }

    // Save subscription to Supabase
    await saveSubscriptionToDatabase(userId, subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Remove from database
      await removeSubscriptionFromDatabase(userId, subscription.endpoint);
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    throw error;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Check if user is subscribed
 */
export async function isSubscribed(userId) {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return false;

    // Check if subscription exists in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .single();

    return !error && data !== null;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Save subscription to Supabase database
 */
async function saveSubscriptionToDatabase(userId, subscription) {
  try {
    const subscriptionJSON = subscription.toJSON();
    const { endpoint, keys } = subscriptionJSON;

    // Get user agent for tracking
    const userAgent = navigator.userAgent;

    // Upsert subscription (insert or update if exists)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
        }
      );

    if (error) {
      console.error('Error saving subscription to database:', error);
      throw error;
    }

    console.log('Subscription saved to database');
    return true;
  } catch (error) {
    console.error('Error in saveSubscriptionToDatabase:', error);
    throw error;
  }
}

/**
 * Remove subscription from Supabase database
 */
async function removeSubscriptionFromDatabase(userId, endpoint) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error removing subscription from database:', error);
      throw error;
    }

    console.log('Subscription removed from database');
    return true;
  } catch (error) {
    console.error('Error in removeSubscriptionFromDatabase:', error);
    throw error;
  }
}

/**
 * Send test notification (for testing purposes)
 * This would typically be called from backend, but useful for testing
 */
export async function sendTestNotification(userId) {
  try {
    // This would be an API call to your backend/Edge Function
    // For now, we'll call the Supabase Edge Function directly
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userId: userId,
        notification: {
          title: 'Test Notification',
          body: 'This is a test push notification from Track My Academy!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          data: {
            type: 'test',
            url: '/',
          },
        },
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

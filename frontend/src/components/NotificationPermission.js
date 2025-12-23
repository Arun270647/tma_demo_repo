import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Loader } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
  sendTestNotification,
} from '../utils/pushNotifications';

const NotificationPermission = () => {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, [user]);

  const checkNotificationStatus = async () => {
    try {
      setLoading(true);

      // Check if supported
      const isSupported = isPushNotificationSupported();
      setSupported(isSupported);

      if (!isSupported) {
        setLoading(false);
        return;
      }

      // Check permission
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      // Check if subscribed (only if user is logged in)
      if (user?.id && currentPermission === 'granted') {
        const userSubscribed = await isSubscribed(user.id);
        setSubscribed(userSubscribed);

        // Show banner if not subscribed but has permission
        if (!userSubscribed && currentPermission === 'granted') {
          setTimeout(() => setShowBanner(true), 2000);
        }
      } else if (currentPermission === 'default') {
        // Show banner if permission not requested
        setTimeout(() => setShowBanner(true), 3000);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!user?.id) {
      alert('Please log in to enable notifications');
      return;
    }

    try {
      setProcessing(true);
      await subscribeToPush(user.id);
      setSubscribed(true);
      setPermission('granted');
      setShowBanner(false);
      alert('✅ Notifications enabled! You will now receive important updates.');
    } catch (error) {
      console.error('Error enabling notifications:', error);
      if (error.message.includes('denied')) {
        alert('❌ Notification permission denied. Please enable notifications in your browser settings.');
      } else {
        alert('❌ Failed to enable notifications. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!user?.id) return;

    try {
      setProcessing(true);
      await unsubscribeFromPush(user.id);
      setSubscribed(false);
      alert('Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      alert('Failed to disable notifications');
    } finally {
      setProcessing(false);
    }
  };

  const handleTest = async () => {
    if (!user?.id) return;

    try {
      setProcessing(true);
      await sendTestNotification(user.id);
      alert('✅ Test notification sent! Check your notifications.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('❌ Failed to send test notification');
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Don't show again for 7 days
    localStorage.setItem('notification-banner-dismissed', Date.now().toString());
  };

  // Don't show if not supported or not logged in
  if (!supported || !user) {
    return null;
  }

  // Don't show banner if dismissed recently
  const dismissedTime = localStorage.getItem('notification-banner-dismissed');
  if (dismissedTime) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7 && !subscribed) {
      return null;
    }
  }

  // Show banner if not subscribed
  if (showBanner && !subscribed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div
          className={`${
            isLight
              ? 'bg-white border-gray-200 shadow-xl'
              : 'bg-gray-800 border-gray-700 shadow-2xl'
          } border rounded-xl p-4 relative`}
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
              isLight
                ? 'hover:bg-gray-100 text-gray-500'
                : 'hover:bg-gray-700 text-gray-400'
            }`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-4 pr-6">
            <div
              className={`p-3 rounded-xl ${
                isLight ? 'bg-blue-50' : 'bg-blue-900/30'
              }`}
            >
              <Bell className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            </div>

            <div className="flex-1">
              <h3
                className={`text-base font-semibold mb-1 ${
                  isLight ? 'text-gray-900' : 'text-white'
                }`}
              >
                Stay Updated!
              </h3>
              <p
                className={`text-sm mb-4 ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                Get notified about attendance, training plans, messages, and more.
              </p>

              {/* Enable Button */}
              <button
                onClick={handleEnable}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Enable Notifications
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything else
  return null;
};

export default NotificationPermission;

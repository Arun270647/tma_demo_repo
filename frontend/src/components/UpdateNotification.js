import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isLight } = useTheme();

  useEffect(() => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let updateInterval;

    // Function to check for updates
    const checkForUpdates = () => {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every 5 minutes (reduced from 60s for better performance)
        updateInterval = setInterval(() => {
          registration.update();
        }, 300000); // 5 minutes
      });
    };

    // Event handler for controller change
    const handleControllerChange = () => {
      // Don't reload if this is the first service worker
      if (!navigator.serviceWorker.controller) {
        return;
      }
      // Reload to get new content
      window.location.reload();
    };

    // Event handler for update found
    const handleUpdateFound = (registration) => {
      return () => {
        const newWorker = registration.installing;

        const handleStateChange = () => {
          // If there's an old service worker, show update notification
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowUpdate(true);
          }
        };

        newWorker.addEventListener('statechange', handleStateChange);
      };
    };

    // Listen for service worker updates
    navigator.serviceWorker.ready.then((registration) => {
      // Check if there's already a waiting worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdate(true);
      }

      // Listen for new service worker installing
      registration.addEventListener('updatefound', handleUpdateFound(registration));
    });

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Start checking for updates
    checkForUpdates();

    // Cleanup function
    return () => {
      // Clear the update interval
      if (updateInterval) {
        clearInterval(updateInterval);
      }

      // Remove event listener
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) {
      return;
    }

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting and become active
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // The page will reload automatically when controller changes
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`${
          isLight
            ? 'bg-white border-gray-200 shadow-2xl'
            : 'bg-gray-800 border-gray-700 shadow-2xl'
        } border rounded-xl p-6 relative w-full max-w-md animate-scale-in`}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          disabled={isUpdating}
          className={`absolute top-3 right-3 p-1 rounded-lg transition-colors disabled:opacity-50 ${
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
              isLight ? 'bg-green-50' : 'bg-green-900/30'
            }`}
          >
            <RefreshCw
              className={`w-6 h-6 ${
                isLight ? 'text-green-600' : 'text-green-400'
              } ${isUpdating ? 'animate-spin' : ''}`}
            />
          </div>

          <div className="flex-1">
            <h3
              className={`text-base font-semibold mb-1 ${
                isLight ? 'text-gray-900' : 'text-white'
              }`}
            >
              {isUpdating ? 'Updating...' : 'Update Available'}
            </h3>
            <p
              className={`text-sm mb-4 ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              {isUpdating
                ? 'Applying update and reloading...'
                : 'A new version of Track My Academy is available. Update now to get the latest features!'}
            </p>

            {/* Update Button */}
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;

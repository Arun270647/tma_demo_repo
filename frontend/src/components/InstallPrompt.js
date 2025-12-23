import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { isLight } = useTheme();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      // Don't show again for 7 days after dismissal
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the custom install prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal time
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't render if app is installed or prompt shouldn't show
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div
        className={`${
          isLight
            ? 'bg-white border-gray-200 shadow-xl'
            : 'bg-gray-800 border-gray-700 shadow-2xl'
        } border rounded-xl p-4 relative backdrop-blur-lg`}
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
            <Smartphone className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
          </div>

          <div className="flex-1">
            <h3
              className={`text-base font-semibold mb-1 ${
                isLight ? 'text-gray-900' : 'text-white'
              }`}
            >
              Install Track My Academy
            </h3>
            <p
              className={`text-sm mb-4 ${
                isLight ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              Install our app for quick access, offline support, and a native app experience!
            </p>

            {/* Install Button */}
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

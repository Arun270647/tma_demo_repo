import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { isPWA } from '../utils/pwaHelpers';
import LandingPage from './LandingPage';

/**
 * PWA Router Component
 * Handles routing logic for PWA vs Web Browser
 *
 * PWA Mode (Installed App):
 * - Logged out users → Redirect to /login
 * - Logged in users → Normal routing
 *
 * Web Browser Mode:
 * - Show landing page normally
 * - Users can browse marketing pages
 */
const PWARouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) {
      return;
    }

    // Only apply this logic on the root path
    if (location.pathname === '/') {
      const isRunningAsPWA = isPWA();

      // If running as PWA, redirect based on auth status
      if (isRunningAsPWA) {
        if (!user) {
          console.log('[PWA Router] Running as PWA and not authenticated, redirecting to login');
          navigate('/login', { replace: true });
        } else {
          // PWA users who are authenticated shouldn't see landing page either
          // Redirect them to their appropriate dashboard
          console.log('[PWA Router] Running as PWA and authenticated, redirecting to app');
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [user, loading, location.pathname, navigate]);

  // While loading, show nothing (or a loading spinner)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render landing page for PWA users - they'll be redirected
  const isRunningAsPWA = isPWA();
  if (isRunningAsPWA) {
    // Show loading while redirect happens
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Only web browsers see the landing page
  return <LandingPage />;
};

export default PWARouter;

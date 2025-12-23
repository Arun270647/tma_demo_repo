import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import './App.css';
import {
  initializeBadge,
  setupBadgeAutoClearing,
  incrementBadge,
  decrementBadge
} from './utils/badgeHelpers';
import { setupAutoSync } from './utils/syncQueue';
import { setupOfflineIndicators } from './utils/offlineHelpers';
import SplashScreen from './components/SplashScreen';
import { initializeAnalytics } from './utils/pwaAnalytics';
import { initializePerformanceMonitoring } from './utils/performanceMonitor';
import { logPWAInfo } from './utils/pwaHelpers';

// Context
import { AuthProvider } from './AuthContext';
// Components
import UpdateNotification from './components/UpdateNotification';
import NotificationPermission from './components/NotificationPermission';

import LandingPage from './components/LandingPage';
import PWARouter from './components/PWARouter';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AcademyDashboard from './components/AcademyDashboard';
import PlayerLoginPage from './components/PlayerLoginPage';
import PlayerDashboard from './components/PlayerDashboard';
import PlayerDashboardNew from './components/PlayerDashboardNew';
import CoachLayout from './components/CoachLayout';
import CoachDashboard from './components/CoachDashboard';
import CoachProfile from './components/CoachProfile';
import AttendanceTracker from './components/AttendanceTracker';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import ProtectedRoute from './components/ProtectedRoute';

// New Pages

import FoundersPage from './components/FoundersPage';
import TeamPage from './components/TeamPage';
import ContactPage from './components/ContactPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import CareersPage from './components/CareersPage';
import JobDetailsPage from './components/JobDetailsPage';
import JobApplyPage from './components/JobApplyPage';
import BlogLoginPage from './components/BlogLoginPage';
import BlogWriterDashboard from './components/BlogWriterDashboard';
import BlogAdminDashboard from './components/BlogAdminDashboard';
import BlogsPage from './components/BlogsPage';

/**
 * Root application component that configures top-level providers and client-side routing.
 *
 * Defines public routes (/, /login, /player-login, /founders, /team, /contact, /privacy-policy, /terms-of-service)
 * and protected routes (/dashboard, /academy, /player-dashboard, /coach/*) including role-based redirection and
 * nested coach routes (dashboard, attendance, performance, profile).
 *
 * @returns {JSX.Element} The rendered application tree wrapped with Helmet, authentication, and theme providers, and the Router containing route definitions.
 */
function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('splash_shown');

    if (splashShown === 'true') {
      // Skip splash if already shown in this session
      setShowSplash(false);
      setAppReady(true);
    }

    // Initialize Badge API on app load
    const initBadge = async () => {
      await initializeBadge();
      setupBadgeAutoClearing();
    };

    initBadge();

    // Initialize Background Sync
    setupAutoSync();

    // Initialize offline indicators
    setupOfflineIndicators();

    // Initialize Analytics
    initializeAnalytics();

    // Initialize Performance Monitoring
    initializePerformanceMonitoring();

    // Log PWA detection info for debugging
    logPWAInfo();

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'INCREMENT_BADGE') {
        incrementBadge();
      } else if (event.data && event.data.type === 'DECREMENT_BADGE') {
        decrementBadge();
      } else if (event.data && event.data.type === 'SYNC_SUCCESS') {
        console.log('Background sync successful:', event.data.syncType);
        // Could show a success toast notification here
      } else if (event.data && event.data.type === 'SYNC_FAILED') {
        console.error('Background sync failed:', event.data.error);
        // Could show an error toast notification here
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Cleanup
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setAppReady(true);
    sessionStorage.setItem('splash_shown', 'true');
  };

  // Show splash screen on first load
  if (showSplash && !appReady) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <div className="App relative">
              {/* PWA Components */}
              <NotificationPermission />
              <UpdateNotification />

              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PWARouter />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/player-login" element={<PlayerLoginPage />} />

                {/* New Public Pages */}
                <Route path="/founders" element={<FoundersPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />

                {/* NEW CAREER ROUTES */}
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/careers/:jobId" element={<JobDetailsPage />} />
                <Route path="/careers/apply/:jobId" element={<JobApplyPage />} />

                {/* BLOG ROUTES */}
                <Route path="/blogs" element={<BlogsPage />} />

                {/* INTERNAL BLOG ROUTES (hidden from navigation) */}
                <Route path="/internal/blog-login" element={<BlogLoginPage />} />
                <Route
                  path="/internal/writer"
                  element={
                    <ProtectedRoute>
                      <BlogWriterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/internal/admin"
                  element={
                    <ProtectedRoute>
                      <BlogAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes - Super Admin Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Academy-specific protected route */}
                <Route
                  path="/academy"
                  element={
                    <ProtectedRoute>
                      <AcademyDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Player-specific protected route */}
                <Route
                  path="/player-dashboard"
                  element={
                    <ProtectedRoute>
                      <PlayerDashboardNew />
                    </ProtectedRoute>
                  }
                />

                {/* Coach Routes with Layout */}
                <Route
                  path="/coach/*"
                  element={
                    <ProtectedRoute>
                      <CoachLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<CoachDashboard />} />
                  <Route path="attendance" element={<AttendanceTracker />} />
                  <Route path="performance" element={<PerformanceAnalytics />} />
                  <Route path="profile" element={<CoachProfile />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
 </HelmetProvider>
 );
}

export default App;

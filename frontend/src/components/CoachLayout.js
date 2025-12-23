import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
  Menu, X, Home, Users, Calendar, TrendingUp,
  User as UserIcon, Bell, LogOut, Trash2
} from 'lucide-react';

const CoachLayout = () => {
  const { user, signOut, token } = useAuth();
  const { isLight } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [academy, setAcademy] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // Logo resolver function - handles both full URLs and relative paths
  const defaultLogoUrl = "https://i.ibb.co/1tLZ0Dp/TMA-LOGO-without-bg.png";
  const resolveLogoSrc = (url) => {
    if (!url) return defaultLogoUrl;
    const v = String(url).trim();
    if (/^(https?:|data:|blob:)/i.test(v)) return v;
    const base = (API_BASE_URL || '').replace(/\/+$/,'');
    const path = v.replace(/^\/+/, '');
    return `${base}/${path}`;
  };

  useEffect(() => {
    loadNotifications();
    loadCoachContext();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const loadCoachContext = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coach/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAcademy(data.academy || null);
      }
    } catch (err) {
      console.error('Error loading coach context:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coach/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_BASE_URL}/api/coach/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/coach/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/coach/dashboard' },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-5 h-5" />, path: '/coach/attendance' },
    { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-5 h-5" />, path: '/coach/performance' },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" />, path: '/coach/profile' },
  ];

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg ${
          isLight ? 'bg-white shadow-md' : 'bg-gray-800 shadow-lg'
        } ${isMobileMenuOpen ? 'hidden' : 'block'}`}
      >
        <Menu className={`w-6 h-6 ${isLight ? 'text-gray-900' : 'text-white'}`} />
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <nav className={`${isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-800 border-r border-gray-700'} w-64 min-h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`lg:hidden absolute top-4 right-4 p-2 rounded-lg ${
              isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
            }`}
          >
            <X className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <img
                src={resolveLogoSrc(academy?.logo_url)}
                alt={academy?.name || 'Academy'}
                className="h-10 w-10 rounded-xl object-contain"
                onError={(e) => { e.currentTarget.src = defaultLogoUrl; }}
              />
              <div>
                <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {academy?.name || 'Coach Portal'}
                </h2>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Dashboard</p>
              </div>
            </div>
            
            <nav className="space-y-2 text-left">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? `${isLight ? 'bg-blue-50 text-blue-600 shadow-sm' : 'bg-blue-600/20 text-blue-400'}`
                      : `${isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-700'}`
                  }`}
                >
                  {item.icon}
                  <span className="text-left">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Top Bar */}
          <header className={`${isLight ? 'bg-white/80 backdrop-blur-sm border-b border-gray-200' : 'bg-gray-800/80 backdrop-blur-sm border-b border-gray-700'} sticky top-0 z-10`}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="lg:hidden w-10" /> {/* Spacer for hamburger button */}
                <h1 className={`text-lg sm:text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} truncate`}>
                  {navItems.find(item => item.path === location.pathname)?.label || 'Coach Portal'}
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} hidden md:block truncate max-w-[150px]`}>
                  {user?.email}
                </p>
                
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'} transition-colors duration-200 relative`}
                  >
                    <Bell className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-lg border ${isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                      <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'} flex items-center justify-between`}>
                        <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          Notifications ({unreadCount} unread)
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className={`text-xs ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-cyan-400 hover:text-cyan-300'}`}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className={`p-4 text-center ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                          No notifications
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.slice(0, 10).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`p-4 cursor-pointer transition-colors ${
                                notif.is_read 
                                  ? isLight ? 'hover:bg-gray-50' : 'hover:bg-gray-700/50'
                                  : isLight ? 'bg-blue-50 hover:bg-blue-100' : 'bg-blue-900/20 hover:bg-blue-900/30'
                              }`}
                            >
                              <p className={`text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                {notif.message}
                              </p>
                              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <ThemeToggle />
                <button
                  onClick={handleSignOut}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isLight
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } flex items-center gap-2`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CoachLayout;

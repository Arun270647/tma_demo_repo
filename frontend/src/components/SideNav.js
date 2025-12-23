// src/components/SideNav.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import DefaultLogo from '../assets/tma_logo.png';
import { LayoutDashboard, Users, User, BarChart, Settings, LifeBuoy, LogOut, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

// The NavItem component is small and specific to SideNav, so it can stay here.
const NavItem = ({ to, icon: Icon, label, isLight, onClick }) => (
  <NavLink
    to={to}
    end
    onClick={onClick} // Close menu on navigation
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
        isActive
          ? (isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-900/50 text-sky-200')
          : (isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-white/10')
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </NavLink>
);

// The props `isOpen` and `onClose` will control the visibility on mobile
const SideNav = ({ academy, user, isOpen, onClose }) => {
  const { isLight } = useTheme();
  const { academySettings } = useAuth() || {};

  const logoUrl = academySettings?.logo_url ? `${process.env.REACT_APP_BACKEND_URL}${academySettings.logo_url}` : DefaultLogo;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/players", icon: Users, label: "Players" },
    { to: "/dashboard/coaches", icon: User, label: "Coaches" },
    { to: "/dashboard/analytics", icon: BarChart, label: "Analytics" },
    { to: "/dashboard/settings", icon: Settings, label: "Settings" }
  ];

  return (
    <>
      {/* OVERLAY for mobile view: shown when the menu is open */}
      <div 
        className={`fixed inset-0 bg-black/60 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* SIDENAV CONTAINER */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-64 flex-shrink-0 border-r 
          ${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-white/10'} 
          flex flex-col z-30
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-20 border-b border-gray-200 dark:border-gray-700 px-4">
          {logoUrl && <img src={logoUrl} alt="Academy Logo" className="h-10 w-auto" />}
          {/* Close button for mobile */}
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => <NavItem key={item.to} {...item} isLight={isLight} onClick={onClose} />)}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <NavItem to="/dashboard/support" icon={LifeBuoy} label="Support" isLight={isLight} onClick={onClose} />
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium mt-2 ${isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-white/10'}`}>
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SideNav;

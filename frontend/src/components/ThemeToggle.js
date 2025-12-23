import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../AuthContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isLight, isDark } = useTheme();
  const { user } = useAuth();

  const handleToggle = () => {
    toggleTheme(user?.email);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300
        ${isLight 
          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200' 
          : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
        }
        group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon for light mode */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300 transform
            ${isLight ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}
          `}
        />

        {/* Moon icon for dark mode */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300 transform
            ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}
          `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
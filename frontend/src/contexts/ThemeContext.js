import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light theme

  // Get unique storage key based on user email
  const getStorageKey = (userEmail) => {
    return userEmail ? `theme-preference-${userEmail}` : 'theme-preference-default';
  };

  // Load theme from localStorage when component mounts or user changes
  const loadTheme = (userEmail) => {
    try {
      const storageKey = getStorageKey(userEmail);
      const savedTheme = localStorage.getItem(storageKey);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      } else {
        setTheme('light'); // Default to light theme
      }
    } catch (error) {
      console.warn('Error loading theme preference:', error);
      setTheme('light');
    }
  };

  // Save theme to localStorage
  const saveTheme = (newTheme, userEmail) => {
    try {
      const storageKey = getStorageKey(userEmail);
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = (userEmail) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveTheme(newTheme, userEmail);
  };

  // Set specific theme
  const setSpecificTheme = (newTheme, userEmail) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
      saveTheme(newTheme, userEmail);
    }
  };

  // Apply theme to document root for global CSS variables if needed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    setSpecificTheme,
    loadTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
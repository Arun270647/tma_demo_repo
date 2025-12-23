import { useTheme } from '../contexts/ThemeContext';

/**
 * Custom hook that provides theme-aware CSS classes
 * Returns different Tailwind classes based on current theme
 */
export const useThemeClasses = () => {
  const { isLight, isDark } = useTheme();

  return {
    // Background classes
    background: {
      primary: isLight 
        ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100' 
        : 'bg-gradient-to-br from-black via-gray-900 to-black',
      secondary: isLight 
        ? 'bg-white border border-gray-200' 
        : 'bg-white/5 backdrop-blur-md border border-white/10',
      tertiary: isLight 
        ? 'bg-gray-50 border border-gray-100' 
        : 'bg-white/5 backdrop-blur-md border border-white/10'
    },

    // Text classes
    text: {
      primary: isLight ? 'text-gray-900' : 'text-white',
      secondary: isLight ? 'text-gray-600' : 'text-gray-300',
      muted: isLight ? 'text-gray-500' : 'text-gray-400',
      accent: isLight ? 'text-sky-600' : 'text-sky-400'
    },

    // Header classes
    header: {
      background: isLight 
        ? 'bg-white/90 backdrop-blur-md border-b border-gray-200' 
        : 'bg-white/5 backdrop-blur-md border-b border-white/10',
      text: isLight ? 'text-gray-900' : 'text-white'
    },

    // Card classes
    card: {
      background: isLight 
        ? 'bg-white border border-gray-200 shadow-sm' 
        : 'bg-white/5 backdrop-blur-md border border-white/10',
      hover: isLight 
        ? 'hover:bg-gray-50 hover:border-gray-300' 
        : 'hover:bg-white/10'
    },

    // Button classes
    button: {
      primary: isLight
        ? 'bg-sky-600 text-white hover:bg-sky-700 border border-sky-600'
        : 'bg-sky-500 text-white hover:bg-sky-600 border border-sky-500',
      secondary: isLight
        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
      danger: isLight
        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
    },

    // Table classes
    table: {
      header: isLight 
        ? 'border-b border-gray-200 bg-gray-50' 
        : 'border-b border-white/10',
      row: isLight 
        ? 'border-b border-gray-100 hover:bg-gray-50' 
        : 'border-b border-white/5 hover:bg-white/5',
      cell: isLight ? 'text-gray-900' : 'text-white'
    },

    // Input classes
    input: {
      base: isLight
        ? 'bg-white border border-gray-300 text-gray-900 focus:ring-sky-500 focus:border-sky-500'
        : 'bg-gray-700 border border-gray-600 text-white focus:ring-sky-500 focus:border-sky-500',
      placeholder: isLight ? 'placeholder-gray-500' : 'placeholder-gray-400'
    },

    // Status classes
    status: {
      success: isLight 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-green-500/20 text-green-400 border border-green-500/30',
      warning: isLight 
        ? 'bg-orange-100 text-orange-800 border border-orange-200' 
        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      error: isLight 
        ? 'bg-red-100 text-red-800 border border-red-200' 
        : 'bg-red-500/20 text-red-400 border border-red-500/30',
      info: isLight 
        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    },

    // Loading spinner
    spinner: isLight ? 'border-gray-300 border-t-sky-600' : 'border-gray-600 border-t-sky-400'
  };
};

export default useThemeClasses;
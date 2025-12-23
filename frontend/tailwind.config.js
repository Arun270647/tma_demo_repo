/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111827',       // Deep charcoal for dark sections
        secondary: '#F9FAFB',     // Clean light background
        accent: '#3B82F6',        // Slightly richer blue for buttons/highlights
        'text-primary': '#F3F4F6',
        'text-secondary': '#9CA3AF',
      },
      backgroundImage: {
        'gradient-mesh': 'radial-gradient(circle at 50% 50%, #1e3a8a, #111827)',
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.6s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.8s ease-out',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.clip-path-button': {
          clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
        },
        '.clip-path-stat': {
          clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
        },
        '.clip-path-mockup': {
          clipPath: 'polygon(0 5%, 95% 0, 100% 95%, 5% 100%)',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    },
  ],
}

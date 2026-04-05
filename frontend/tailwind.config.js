/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Starlink-inspired dark theme colors
        starlink: {
          black: '#000000',
          dark: '#0a0a0a',
          darker: '#141414',
          gray: '#1a1a1a',
          light: '#2a2a2a',
          accent: '#3b82f6', // Blue accent like Starlink
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          text: '#ffffff',
          'text-secondary': '#a0a0a0',
          'text-muted': '#6b7280',
          border: '#2d2d2d',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'starlink': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'starlink-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

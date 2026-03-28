/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'emergency-red': '#DC2626',
        'emergency-red-dark': '#991B1B',
        'emergency-red-glow': '#EF4444',
        'emergency-dark': '#0A0A0A',
        'emergency-surface': '#141414',
        'emergency-card': '#1C1C1E',
        'safe-green': '#22C55E',
        'warning-amber': '#F59E0B',
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'border-subtle': '#27272A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'sos-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)' },
          '50%': { boxShadow: '0 0 0 20px rgba(220, 38, 38, 0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'sos-pulse': 'sos-pulse 1.5s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
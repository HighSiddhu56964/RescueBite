/** @type {import('tailwindcss').Config} */
export default {
<<<<<<< HEAD
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Essential Overrides
        'brand-red': '#E05A5A',        // Primary Action
        'brand-green': '#1B5E20',      // Secondary Accent
        'brand-green-dark': '#004D40', // Profile Typography
        'warm-cream': '#F9F9F9',       // Backgrounds
        'mint-glow': '#D1FAE5',        // Linguistic Glide Selected
        
        // Zero-G backward compatibility
        'zg-bg': '#F9F9F9',
        'zg-card': '#FFFFFF',
        'zg-border': '#E2E8F0',
        'zg-text': '#0F172A',
        'zg-text-secondary': '#475569',
        'zg-text-muted': '#94A3B8',
        'zg-indigo': '#1B5E20',       // Mapped to brand-green
        'zg-emergency': '#E05A5A',    // Mapped to brand-red
        'zg-success': '#16A34A',
        'zg-warning': '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        '8dp': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        '12dp': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'float': '0 8px 30px -4px rgba(0, 0, 0, 0.05)',
        'float-lg': '0 12px 40px -6px rgba(0, 0, 0, 0.08)',
        'float-red': '0 12px 40px -6px rgba(211, 47, 47, 0.25)',
        'float-green': '0 12px 40px -6px rgba(27, 94, 32, 0.2)',
        'dock': '0 -4px 20px rgba(0,0,0,0.03)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'status-glow': 'statusGlow 2s ease-in-out infinite',
        'pulse-fast': 'pulseFast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        statusGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22, 163, 74, 0.4)' },
          '50%': { boxShadow: '0 0 10px rgba(22, 163, 74, 0.2)' },
        },
        pulseFast: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
=======
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
>>>>>>> 996076df1d1a77c5e970ee0820878b3a68fb7813

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#4285F4',
          red: '#EA4335',
          yellow: '#FBBC05',
          green: '#34A853',
        },
        ink: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#BDC1C6',
          500: '#80868B',
          600: '#5F6368',
          700: '#3C4043',
          800: '#202124',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(60,64,67,0.08), 0 1px 3px 1px rgba(60,64,67,0.06)',
        card: '0 4px 12px -2px rgba(60,64,67,0.08), 0 2px 6px -1px rgba(60,64,67,0.05)',
        float: '0 12px 32px -8px rgba(60,64,67,0.12), 0 4px 12px -4px rgba(60,64,67,0.06)',
        glow: '0 0 0 1px rgba(66,133,244,0.18), 0 8px 32px -8px rgba(66,133,244,0.28)',
        'glow-blue': '0 0 24px rgba(66,133,244,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a26',
          600: '#22222e',
          500: '#2e2e3a',
          400: '#3a3a48',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        flame: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        vibe: {
          cyan: '#22d3ee',
          pink: '#ec4899',
          lime: '#a3e635',
          orange: '#fb923c',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        'count-up': 'countUp 0.8s ease-out',
        'marquee': 'marquee 25s linear infinite',
        'marquee-rev': 'marqueeRev 30s linear infinite',
        'eq': 'eq 0.9s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'glow-shift': 'glowShift 4s ease-in-out infinite',
        'wiggle': 'wiggle 3s ease-in-out infinite',
        'pop-in': 'popIn 0.6s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(16,185,129,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeRev: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        eq: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        glowShift: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(244,63,94,0.6))' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-8deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#4f8ef7', hover: '#3a7de8', dim: '#1a3a6f' },
      },
      keyframes: {
        fadeSlideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-slide-up':  'fadeSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-in':        'fadeIn 0.35s ease-out both',
        'slide-in-right': 'slideInRight 0.45s cubic-bezier(0.25, 1.2, 0.5, 1) both',
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.34, 1.3, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}


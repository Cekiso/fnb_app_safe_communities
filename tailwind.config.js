/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Youth palette
        youth: {
          blue: '#3B82F6',
          mint: '#34D399',
          coral: '#FF7A59',
          yellow: '#FFC93C',
          lavender: '#A78BFA',
          cream: '#FFF9F0',
          navy: '#1F2A44',
        },
        // Adult palette — calm, professional, high contrast
        adult: {
          teal: '#0F4C5C',
          'teal-light': '#1A6B7E',
          'teal-dark': '#0A3540',
          navy: '#1B2A4A',
          'navy-light': '#2C3E5E',
          sand: '#F5F1EB',
          'sand-dark': '#E8E0D5',
          accent: '#7C3AED',
          'accent-light': '#9D6BF0',
        },
        // Shared semantic
        danger: '#E5484D',
        'danger-dark': '#C7383C',
        success: '#34D399',
        warning: '#FFC93C',
        error: '#E5484D',
      },
      fontFamily: {
        heading: ['Nunito', 'Fredoka', 'system-ui', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        18: '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

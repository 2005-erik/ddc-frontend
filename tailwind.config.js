/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'ddc-blue': {
          DEFAULT: '#1B4DC1',
          light: '#3B6FE0',
          dark: '#12349A',
        },
        'nbk-gold': {
          DEFAULT: '#FFD700',
          soft: '#FFE98A',
          deep: '#E8B43A',
        },
        // тёмная база
        ink: {
          DEFAULT: '#0A0E1A',
          900: '#070A12',
          800: '#0F1424',
          700: '#1A2138',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

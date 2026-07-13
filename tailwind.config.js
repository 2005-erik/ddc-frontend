/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Фирменный бирюзовый акцент DDC (ранее ddc-blue — синий не входит
        // в брендбук, бирюза — основной акцент, тот же что в глобусе).
        'ddc-blue': {
          DEFAULT: '#2BBAAC',
          light: '#57CFC2',
          dark: '#1E9C90',
        },
        // Бирюза как явный брендовый токен
        'ddc-teal': {
          DEFAULT: '#2BBAAC',
          light: '#57CFC2',
          dark: '#1E9C90',
        },
        // Фирменное золото DDC
        'nbk-gold': {
          DEFAULT: '#FFBB34',
          soft: '#FFD27A',
          deep: '#E0A020',
        },
        // Песочный доп. акцент
        'ddc-sand': '#ECC371',
        // Серые для второстепенного текста
        'ddc-gray': {
          DEFAULT: '#9FA3A6',
          light: '#E6E6E6',
        },
        // Фирменная зелёная база (ранее тёмно-синий ink).
        // DEFAULT — основной фон, 900 — самый тёмный (плашки/подложки).
        ink: {
          DEFAULT: '#0F534C',
          900: '#022622',
          800: '#063D37',
          700: '#0B4A43',
        },
      },
      fontFamily: {
        // Фирменный шрифт DDC — Halvar (если добавлены файлы через @font-face
        // в src/index.css). Пока файлов нет — фолбэк на SF Pro (системный
        // шрифт Apple) по брендбуку, далее system-ui и sans-serif.
        sans: [
          '"Halvar Breitschrift"',
          'Halvar',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

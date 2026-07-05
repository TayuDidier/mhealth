/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ee2b8c',
        'primary-dark': '#c4206e',
        'background-light': '#f8f6f7',
        'background-dark': '#221019',
        'card-dark': '#331926',
        'lavender-soft': '#f3e8ff',
        mint: '#e0f2f1',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(238,43,140,0.07)',
        'card-dark': '0 2px 16px 0 rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}

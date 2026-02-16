/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3e8ff',
          100: '#e0c9ff',
          200: '#c9a7ff',
          300: '#b285ff',
          400: '#9e63ff',
          500: '#8a42ff', // main purple
          600: '#7a32e0',
          700: '#6a25c2',
          800: '#5a1aa3',
          900: '#4a1085',
        },
        dark: {
          50: '#1e1a2b',
          100: '#1a1625',
          200: '#16121f',
          300: '#120e19',
          400: '#0e0a13',
          500: '#0b0710', // background
          600: '#08050c',
          700: '#050308',
          800: '#020104',
          900: '#000000',
        }
      },
    },
  },
  plugins: [],
}
console.log('✅ Tailwind config loaded');
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff6b9d',
          purple: '#b06ab3',
          dark: '#0a0a0f',
        }
      },
      fontFamily: {
        display: ['serif'],
        body: ['sans-serif'],
      }
    },
  },
  plugins: [],
}

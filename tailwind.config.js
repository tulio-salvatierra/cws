/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily: {
        main: ['Clash', 'Arial', 'sans-serif'], 
        secondary: ['Archivo', 'Arial', 'sans-serif'],
      },},
  },
  plugins: [],
}


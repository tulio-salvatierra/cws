/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Clash', 'Arial', 'sans-serif'], 
        heading: ['Archivo', 'Arial', 'sans-serif'],
      },},
  },
  plugins: [],
}


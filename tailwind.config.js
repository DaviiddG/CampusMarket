/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#102042',
        secondary: '#9AD7F3',
        grayBase: '#EEEEEE',
        grayText: '#848484',
        grayDark: '#6D6D6D',
        darkText: '#2F2E41',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(93.02deg, #FF0000 38.65%, #FF4D00 53.47%, #FF004D 70.15%)',
        'soft-gradient': 'linear-gradient(0deg, #9AD7F3, #9AD7F3)'
      }
    },
  },
  plugins: [],
}

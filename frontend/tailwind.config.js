/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#E8F2EF',
            100: '#C9E1DA',
            400: '#1A6B5B',
            500: '#0F4C42',
            600: '#0B3A32',
            900: '#06241F',
          },
          accent: {
            400: '#FF8A6B',
            500: '#FF6B4A',
            600: '#E5512F',
          },
          ink: '#16201D',
          bg: '#F1F7F3',
        },
        fontFamily: {
          display: ['"Bricolage Grotesque"', 'sans-serif'],
          body: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };
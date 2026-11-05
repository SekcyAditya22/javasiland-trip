/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#17233f', navy: '#334eac', sand: '#f5f1ea', mist: '#eef3fb', gold: '#e9b44c' },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Playfair Display', 'serif'] },
      boxShadow: { soft: '0 18px 50px rgba(22, 39, 76, .11)' }
    }
  },
  plugins: []
};

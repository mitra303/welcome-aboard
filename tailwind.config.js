/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        mitra: {
          blue: '#1E4E8C',
          green: '#4CAF50',
        },
      },
    },
  },
  plugins: [],
};

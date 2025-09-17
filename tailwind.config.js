/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'aviation-blue': '#1e40af',
        'aviation-dark': '#1e293b',
        'aviation-gray': '#334155',
      },
    },
  },
  plugins: [],
}


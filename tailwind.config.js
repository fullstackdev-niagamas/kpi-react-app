/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nlg-bg': '#FFFFFF',
        'nlg-surface': '#FFFFFF',
        'nlg-sidebar': '#FAFAFA',
        'nlg-rail': '#F1F3F4',
        'nlg-border': '#DFE1E6',
        'nlg-primary': '#1A73E8',
        'nlg-primary-tint': '#E8F0FE',
        'nlg-text': '#172B4D',
        'nlg-text-muted': '#5E6C84',
        'nlg-text-subdued': '#8993A4',
      },
      borderRadius: {
        'nlg-input': '12px',
        'nlg-card': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:   { DEFAULT: '#060607', 1: '#0e0f10', 2: '#151618', 3: '#1d1e21', 4: '#292a2e' },
        hi:    '#f5f5f7',
        mid:   '#a3a3ab',
        low:   '#6f6f78',
        mint:  { DEFAULT: '#3ee8ad', deep: '#17a877' },
        amber: '#ffb648',
        rose:  '#ff6b61',
        sky:   '#5b8def',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { tightest: '-0.045em', tighter: '-0.03em' },
      borderRadius: { '4xl': '28px', '5xl': '36px' },
      boxShadow: {
        art: '0 1px 0 rgba(255,255,255,0.08) inset, 0 18px 40px -18px rgba(0,0,0,0.9)',
        lift: '0 30px 60px -30px rgba(0,0,0,0.9)',
      },
    },
  },
  plugins: [],
}

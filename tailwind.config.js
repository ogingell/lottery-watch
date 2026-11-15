/** @type {import('tailwindcss').Config} */

// All colors resolve to CSS variables defined in src/index.css so the
// palette flips between light and dark mode. Variables hold "R G B"
// triplets, letting Tailwind opacity modifiers (e.g. bg-void-900/80) work.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background / surface scale (darkest → lightest in dark mode;
        // inverted automatically in light mode via the variables)
        void: {
          950: v('void-950'), // page background
          900: v('void-900'), // panel base
          850: v('void-850'),
          800: v('void-800'), // raised panel
          700: v('void-700'), // borders / dividers
          600: v('void-600'),
        },
        // Signal / data colors (legacy names kept; values re-hued per mode)
        hud: {
          cyan:    v('accent-blue'),   // informational accent
          teal:    v('accent-teal'),
          green:   v('positive'),      // positive movement
          amber:   v('warning'),       // caution
          red:     v('negative'),      // negative movement
          magenta: v('accent-violet'),
          blue:    v('accent-blue'),
          ice:     v('text-strong'),   // highlighted text
        },
        // Brand
        coral: {
          DEFAULT: v('coral'),
          strong:  v('coral-strong'),
        },
        navy: {
          DEFAULT: v('navy'),
        },
        brand: {
          50:  '#fff1f0',
          100: '#ffe0dd',
          200: '#ffc4bf',
          300: '#ff9d94',
          400: '#ff6a5e',
          500: '#ff4f40',
          600: '#e8402f',
          700: '#c33122',
          800: '#9c2a1f',
          900: '#7d2721',
        },
        accent: {
          coral:  v('coral'),
          orange: v('warning'),
          yellow: v('warning'),
          green:  v('positive'),
          teal:   v('accent-teal'),
          cyan:   v('accent-blue'),
          violet: v('accent-violet'),
          pink:   v('accent-violet'),
        },
        // Text scale (strong → faint)
        surface: {
          50:  v('text-strong'),
          100: v('text-primary'),
          200: v('text-secondary'),
          300: v('text-tertiary'),
          400: v('text-muted'),
          500: v('text-faint'),
          600: v('void-600'),
          700: v('void-700'),
          800: v('void-800'),
          900: v('void-900'),
        }
      },
      fontFamily: {
        title: ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        // Numbers use SF tabular figures rather than a monospace face
        mono: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow':        'var(--card-shadow)',
        'glow-lg':     'var(--card-shadow-hover)',
        'glow-green':  'var(--card-shadow)',
        'glow-amber':  'var(--card-shadow)',
        'glow-red':    'var(--card-shadow)',
        'card':        '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
        'card-hover':  'var(--card-shadow-hover)',
        'sheet':       '0 -8px 40px rgba(0,0,0,0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'blink': 'blink 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.45' },
        },
      },
    },
  },
  plugins: [],
}

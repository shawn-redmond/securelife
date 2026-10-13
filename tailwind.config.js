/**
 * bundle.insure theme (dark). Colour values sampled from bundle.insure.
 *
 * The prototype was written against light-theme utility names (bg-white cards,
 * text-ink-900 text, bg-*-50 tints). Rather than rewrite every component, the
 * scales are remapped for a dark ground:
 *   - `white` is the card surface, so `bg-white` cards and `text-white` on accent fills both work
 *   - `ink` is inverted: low numbers are dark surfaces, high numbers are light text
 *   - accent scales run from dark tints (50–300) through the base colour (500) to light text (600–950)
 */
const NAVY = '#0C192B'

const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16))
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t))

/** Dark-ground scale from one base colour. */
const scale = (c) => ({
  50: mix(NAVY, c, 0.12),
  100: mix(NAVY, c, 0.2),
  200: mix(NAVY, c, 0.35),
  300: mix(NAVY, c, 0.55),
  400: mix(NAVY, c, 0.8),
  500: c,
  600: mix(c, '#ffffff', 0.18),
  700: mix(c, '#ffffff', 0.3),
  800: mix(c, '#ffffff', 0.45),
  900: mix(c, '#ffffff', 0.62),
  950: mix(c, '#ffffff', 0.8),
})

const YELLOW = '#FFC211'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: NAVY,
        white: '#132338',
        // Brand accent: solid fills (500–700) stay the brand yellow so buttons match the site.
        brand: {
          ...scale(YELLOW),
          500: YELLOW,
          600: YELLOW,
          700: YELLOW,
          800: '#FFD042',
          900: '#FFE08A',
          950: '#FFF0C2',
        },
        ink: {
          50: '#182739',
          100: '#1E2B3B',
          200: '#2C3B4F',
          300: '#3E4E63',
          400: '#6E7F94',
          500: '#8C9BAE',
          600: '#AAB8C6',
          700: '#C0CCD8',
          800: '#DCE4EC',
          900: '#EEF2F6',
          950: '#FFFFFF',
        },
        // Logo dot colours, reused for product accents and states.
        rose: scale('#EF009B'),
        green: scale('#29AF3E'),
        violet: scale('#287EFF'),
        sky: scale('#38BDF8'),
        amber: scale('#FF9F1C'),
        slate: scale('#94A3B8'),
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.25), 0 6px 20px -8px rgba(0,0,0,.45)',
        lift: '0 2px 6px rgba(0,0,0,.3), 0 16px 40px -12px rgba(0,0,0,.6)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-40%)' },
          '50%': { transform: 'translateY(40%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        pop: 'pop .5s cubic-bezier(.2,.9,.3,1.2) both',
        scan: 'scan 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

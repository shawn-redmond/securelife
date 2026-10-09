/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf6',
          100: '#d1fae9',
          200: '#a6f3d5',
          300: '#6be6bd',
          400: '#30d0a0',
          500: '#0db68a',
          600: '#039370',
          700: '#04755c',
          800: '#075d4b',
          900: '#074c3f',
          950: '#022b24',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c9',
          400: '#8591ab',
          500: '#667391',
          600: '#515c78',
          700: '#424b62',
          800: '#2b3142',
          900: '#1a1e2b',
          950: '#0f121a',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px -4px rgba(16,24,40,.08)',
        lift: '0 2px 4px rgba(16,24,40,.06), 0 12px 32px -8px rgba(16,24,40,.16)',
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

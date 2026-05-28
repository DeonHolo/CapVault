/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Satoshi', 'Aptos', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Cascadia Mono', 'monospace']
      },
      colors: {
        ink: {
          950: '#18181b',
          900: '#27272a',
          700: '#3f3f46',
          500: '#71717a'
        },
        vault: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#059669',
          600: '#047857',
          700: '#065f46'
        }
      },
      boxShadow: {
        diffusion: '0 20px 40px -24px rgba(24, 24, 27, 0.18)'
      }
    }
  },
  plugins: []
};

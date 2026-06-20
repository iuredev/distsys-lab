/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        canvas: {
          light: '#ffffff',
          dark: '#060a0f',
          paper: '#f8fafc',
        },
        tactical: {
          bg: '#060a0f',
          surface: '#0b1015',
          raised: '#10161d',
          border: '#1f262f',
          line: '#28303a',
          label: '#7d8590',
          dim: '#9198a1',
          text: '#e6edf3',
        },
        signal: {
          green: '#22d3a0',
          amber: '#f59e0b',
          red: '#f05252',
          cyan: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        'caret-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};

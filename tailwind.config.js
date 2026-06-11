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
          dark: '#0a0a0b',
          paper: '#f8fafc',
        },
        tactical: {
          bg: '#0a0a0b',
          surface: '#101012',
          raised: '#16161a',
          border: '#26262b',
          line: '#2f2f36',
          label: '#8a909c',
          dim: '#aab0bb',
          text: '#e5e7eb',
        },
        signal: {
          green: '#34d399',
          amber: '#d9a441',
          red: '#e5645f',
          cyan: '#56b6c8',
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

/** @type {import('tailwindcss').Config} */

// Neutros quentes (tinta) — substituem o "slate" azulado padrão do Tailwind.
const ink = {
  50: '#f6f4ef',
  100: '#ebe8e1',
  200: '#d9d5cb',
  300: '#b9b4a7',
  400: '#8f8a7d',
  500: '#6d695e',
  600: '#4d4a42',
  700: '#35332d',
  800: '#262520',
  900: '#1b1a17',
  950: '#12110f',
};

// Acento único: dourado fosco.
const gold = {
  50: '#faf4e3',
  100: '#f4e8c6',
  200: '#ebd29c',
  300: '#e0ba6f',
  400: '#d4a24c',
  500: '#bf8a34',
  600: '#a07028',
  700: '#7a561f',
  800: '#533a16',
  900: '#33250e',
  950: '#1e1509',
};

const steel = { 50:'#eef5f8',100:'#d6e6ee',200:'#b0cfdd',300:'#86b5c9',400:'#5f9bb5',500:'#47809a',600:'#386680',700:'#2e5167',800:'#25404f',900:'#1b2e39',950:'#111d25' };
const brick = { 50:'#fbf1ee',100:'#f5ddd6',200:'#ebbcae',300:'#e09a86',400:'#d27a62',500:'#bc5d46',600:'#9d4a37',700:'#7c3a2c',800:'#5a2b21',900:'#3a1c16',950:'#22100c' };
const sage = { 50:'#f1f6ee',100:'#dfead8',200:'#c0d6b3',300:'#9dbd8b',400:'#7ba166',500:'#5f854c',600:'#4a6a3b',700:'#3b5430',800:'#2d4125',900:'#1f2c1a',950:'#121a0f' };

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: ink,
        purple: gold,
        cyan: steel,
        sky: steel,
        rose: brick,
        red: brick,
        emerald: sage,
        green: sage,
        ametist: {
          950: ink[950],
          900: ink[900],
          850: '#1f1e1a',
          800: ink[800],
          750: '#2d2c26',
          700: ink[700],
          600: gold[600],
          500: gold[500],
          400: gold[400],
          300: gold[300],
          200: gold[200],
          100: gold[100],
          50: gold[50],
        },
        elem: {
          pyro: '#e4795f',
          hydro: '#5aa9d6',
          anemo: '#5cc4b0',
          electro: '#b58be0',
          dendro: '#8cc063',
          cryo: '#8fd0e6',
          geo: '#e0b04a',
          neutral: '#d9d5cb'
        }
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        // Mantido o nome "cinzel" para não quebrar classes existentes; agora é a fonte de títulos.
        cinzel: ['"Newsreader"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.625rem',
        '2xl': '0.75rem',
        '3xl': '0.875rem',
      },
      boxShadow: {
        'ametist-sm': '0 1px 2px rgba(0, 0, 0, 0.35)',
        'ametist-md': '0 2px 8px rgba(0, 0, 0, 0.35)',
        'ametist-glow': '0 2px 8px rgba(0, 0, 0, 0.35)',
        'crystal': '0 1px 2px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'ametist-gradient': 'none',
        'crystal-card': 'none',
        'crystal-glow': 'none',
      }
    },
  },
  plugins: [],
}

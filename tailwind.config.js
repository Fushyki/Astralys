/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ametist: {
          950: '#07030e',
          900: '#0f071d',
          850: '#150a29',
          800: '#1d0e37',
          750: '#261347',
          700: '#381c68',
          600: '#6d28d9',
          500: '#8b5cf6',
          400: '#a855f7',
          300: '#c084fc',
          200: '#d8b4fe',
          100: '#f3e8ff',
          50: '#faf5ff',
        },
        elem: {
          pyro: '#f87171',
          hydro: '#38bdf8',
          anemo: '#2dd4bf',
          electro: '#c084fc',
          dendro: '#4ade80',
          cryo: '#7dd3fc',
          geo: '#fbbf24',
          neutral: '#e2e8f0'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        cinzel: ['"Cinzel"', 'serif'],
      },
      boxShadow: {
        'ametist-sm': '0 2px 10px rgba(168, 85, 247, 0.15)',
        'ametist-md': '0 8px 30px rgba(168, 85, 247, 0.2)',
        'ametist-glow': '0 0 25px rgba(168, 85, 247, 0.35)',
        'crystal': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 10px 30px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'ametist-gradient': 'radial-gradient(ellipse at 50% 0%, #26114a 0%, #0c0517 75%)',
        'crystal-card': 'linear-gradient(135deg, rgba(33, 16, 67, 0.7) 0%, rgba(15, 7, 29, 0.85) 100%)',
        'crystal-glow': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
      }
    },
  },
  plugins: [],
}

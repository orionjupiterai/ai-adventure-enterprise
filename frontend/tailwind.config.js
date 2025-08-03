/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
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
        adventure: {
          'dark': '#1a1a2e',
          'darker': '#16213e',
          'accent': '#e94560',
          'secondary': '#0f3460',
        }
      },
      fontFamily: {
        'fantasy': ['Cinzel', 'serif'],
        'game': ['Press Start 2P', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(233, 69, 96, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.8), 0 0 40px rgba(233, 69, 96, 0.6)' },
        }
      },
      backgroundImage: {
        'adventure-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'hero-pattern': "url('/images/hero-pattern.svg')",
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
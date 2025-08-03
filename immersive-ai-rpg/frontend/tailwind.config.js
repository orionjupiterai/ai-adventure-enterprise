/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          primary: '#8B5CF6',
          secondary: '#3B82F6',
          accent: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          dark: {
            100: '#1E293B',
            200: '#0F172A',
            300: '#020617'
          }
        },
        fantasy: {
          gold: '#FFD700',
          mystic: '#9333EA',
          nature: '#059669',
          blood: '#DC2626'
        },
        scifi: {
          neon: '#00D9FF',
          cyber: '#FF00FF',
          tech: '#00FF00',
          energy: '#FFFF00'
        }
      },
      fontFamily: {
        game: ['Cinzel', 'serif'],
        ui: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-game': 'linear-gradient(to bottom right, #8B5CF6, #3B82F6)',
        'gradient-dark': 'linear-gradient(to bottom, #0F172A, #020617)'
      }
    },
  },
  plugins: [],
}
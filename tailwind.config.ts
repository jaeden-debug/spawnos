import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spawn: {
          bg: '#080c0f',
          surface: '#0d1117',
          card: '#111820',
          border: '#1c2a35',
          cyan: '#00d4ff',
          'cyan-dim': '#0099bb',
          'cyan-glow': 'rgba(0, 212, 255, 0.15)',
          amber: '#f59e0b',
          'amber-dim': '#d97706',
          emerald: '#10b981',
          rose: '#f43f5e',
          muted: '#4a6070',
          'muted-text': '#8899a6',
          text: '#e2eaf0',
          'text-dim': '#b0bec5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
        'cyan-glow': 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
        'hero-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.12) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
        'cyan-sm': '0 0 10px rgba(0, 212, 255, 0.2)',
        'amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 40px rgba(0, 212, 255, 0.15)',
      },
      animation: {
        'pulse-cyan': 'pulse-cyan 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config

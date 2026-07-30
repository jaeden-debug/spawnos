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
        // Matched to Blackwater Aquatics Canada (Savor 3.1.0) storefront tokens.
        spawn: {
          bg: '#000000',
          surface: '#0a0d0d',
          card: '#101414',
          border: '#1e2626',
          'border-strong': '#2b3533',
          gold: '#cbb06d',
          cyan: '#6bfcf6',
          'cyan-dim': '#2fbdb8',
          'cyan-glow': 'rgba(107, 252, 246, 0.15)',
          amber: '#ee9441',
          'amber-dim': '#c9701f',
          emerald: '#3ed660',
          rose: '#ff5c5c',
          muted: '#6b706a',
          'muted-text': '#8c9084',
          text: '#deded1',
          'text-dim': '#a7a99c',
          heading: '#ffffff',
        },
      },
      fontFamily: {
        // Body text is monospace on Blackwater; headings are Barlow Condensed.
        sans: ['var(--font-mono-stack)'],
        mono: ['var(--font-mono-stack)'],
        display: ['var(--font-display)'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(107, 252, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(107, 252, 246, 0.03) 1px, transparent 1px)",
        'cyan-glow': 'radial-gradient(ellipse at center, rgba(107, 252, 246, 0.15) 0%, transparent 70%)',
        'hero-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(107, 252, 246, 0.12) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'cyan': '0 0 20px rgba(107, 252, 246, 0.3)',
        'cyan-sm': '0 0 10px rgba(107, 252, 246, 0.2)',
        'amber': '0 0 20px rgba(238, 148, 65, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 40px rgba(107, 252, 246, 0.15)',
      },
      animation: {
        'pulse-cyan': 'pulse-cyan 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(107, 252, 246, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(107, 252, 246, 0.5)' },
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

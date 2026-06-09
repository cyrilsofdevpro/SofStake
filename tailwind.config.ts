import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#090A14',
        surface: '#0F172A',
        accent: '#7C3AED',
        accent2: '#22D3EE',
        neon: '#84F3FF',
        success: '#22C55E',
        warning: '#F59E0B'
      },
      boxShadow: {
        glow: '0 0 32px rgba(124, 58, 237, 0.24)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;

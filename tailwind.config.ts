import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: { 0: '#0B0B0F', 1: '#131318', 2: '#1A1A21' },
        brd: 'rgba(255,255,255,0.08)',
        mut: '#7A7A82',
        fg: '#E8E6E1',
        brand: { DEFAULT: '#7F77DD', light: 'rgba(127,119,221,0.12)' },
        success: '#639922',
        warning: '#EF9F27',
        danger: '#E24B4A',
        info: '#378ADD',
        teal: '#1D9E75',
        pink: '#D4537E',
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
export default config;

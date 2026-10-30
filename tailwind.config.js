/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Terratern Official Brand Palette
        brand: {
          navy: '#00215C',      // Secondary 900
          blue: '#255CC1',      // Primary 600
          'blue-hover': '#3077e0', // Primary 700
          'blue-500': '#4594ec',
          'blue-400': '#69b2f1',
          'blue-300': '#99cef7',
          'blue-200': '#c3e0fa',
          'blue-100': '#ddedfc',
          'blue-50': '#f0f7fe',
          yellow: '#f1c819',    // Terratern Accent/Gold
          'yellow-hover': '#e6bd0d',
          'yellow-light': '#faee8e',
        },
        navy: {
          DEFAULT: '#00215C',
          50: '#F0F4FC',
          100: '#DDE6F9',
          200: '#BDCEF4',
          300: '#94B0ED',
          400: '#678EE5',
          500: '#3D6FDE',
          600: '#255CC1',
          700: '#1B4699',
          800: '#143471',
          900: '#00215C',
          950: '#001336',
        },
        primary: {
          DEFAULT: '#00215C',
          hover: '#143471',
          blue: '#255CC1',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#00215C',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#f1c819',
          hover: '#e6bd0d',
          blue: '#255CC1',
          light: '#EBF2FF',
          foreground: '#00215C',
        },
        neutral: {
          50: '#fafafa',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#707070',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
        },
        background: {
          DEFAULT: '#FAFBFF',
          alt: '#FFFFFF',
        },
        foreground: {
          DEFAULT: '#111111',
          muted: '#5d5d5d',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#111111',
        },
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#255CC1',
      },
      fontFamily: {
        display: ['Poppins', '"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['Poppins', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Roboto', 'Poppins', 'sans-serif'],
        sans: ['Roboto', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'dock': '0 12px 32px rgba(0, 33, 92, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'brand': '0 10px 20px rgba(37, 92, 193, 0.10)',
      },
      screens: {
        'xs': '360px',
      },
    },
  },
  plugins: [],
};

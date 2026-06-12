/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        organic: {
          50: '#F5F8F4',
          100: '#E6EFE4',
          200: '#C2DCBC',
          300: '#9ECA95',
          400: '#5FB050',
          500: '#2E7D32', // Primary Organic Green
          600: '#246327',
          700: '#1A471C',
          800: '#112F12',
          900: '#091A0A',
        },
        earth: {
          50: '#FAF8F5',
          100: '#F4ECE3',
          200: '#E3CEBA',
          300: '#CDA888',
          400: '#B27C55',
          500: '#8B5A2B', // Clay/Earth Accent
          600: '#754B24',
          700: '#5E3B1C',
          800: '#482D16',
          900: '#26180B',
        },
        cream: {
          50: '#FDFDFB',
          100: '#FDFBF7',
          200: '#FAF6EF',
          300: '#FAF0E6', // Warm Cream Background
          400: '#F5E4D3',
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}

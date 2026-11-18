/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f6fb',
          100: '#e6ecf5',
          300: '#8fa9d1',
          500: '#2f5d9e',
          700: '#1b3a66',
          900: '#0b1f3a',
        },
        muted: '#6b7280',
        line: '#e3e6eb',
        success: '#1e8e5a',
        danger: '#c0392b',
      },
      fontFamily: {
        regular: ['Poppins_400Regular'],
        medium: ['Poppins_500Medium'],
        semibold: ['Poppins_600SemiBold'],
      },
    },
  },
  plugins: [],
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F6F3',
        surface: '#FFFFFF',
        border: '#E3E5E0',
        ink: '#1B211E',
        muted: '#6B7268',
        brand: {
          DEFAULT: '#0E5C56',
          dark: '#0A4642',
          light: '#E6EFEE'
        },
        usd: {
          DEFAULT: '#A97C1F',
          light: '#F5EBD6'
        },
        rub: {
          DEFAULT: '#35519C',
          light: '#E4E9F5'
        },
        danger: {
          DEFAULT: '#B14A3A',
          light: '#F6E7E4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '8px'
      }
    }
  },
  plugins: []
}

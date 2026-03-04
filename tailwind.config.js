/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cs: {
          charcoal:  '#1C1C1E',
          gold:      '#C49A2A',
          'gold-lt': '#E8C84A',
          cream:     '#F5F0E8',
          'cream-dk':'#EDE6D8',
          forest:    '#2C3E2D',
          sage:      '#5E8A6E',
          rose:      '#C25C6E',
          muted:     '#8C8C8C',
          border:    '#E2D9CC',
          surface:   '#FEFCF8',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

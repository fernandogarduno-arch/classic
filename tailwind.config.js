/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cs: {
          // Fondos
          bg:        '#F2F4F3',      // fondo general — casi blanco verdoso
          surface:   '#FFFFFF',      // cards
          sidebar:   '#1a1a2e',      // sidebar oscuro
          'sidebar-lt': '#242444',   // hover sidebar

          // Textos
          charcoal:  '#1C2526',      // texto principal
          muted:     '#6B7280',      // texto secundario
          'on-dark': '#E8EDE9',      // texto sobre sidebar

          // Acento
          olive:     '#4A6741',      // verde oliva principal
          'olive-lt':'#6B9460',      // hover
          'olive-bg':'#EEF3ED',      // fondo suave oliva

          // Bordes y superficies
          border:    '#DDE3DE',
          cream:     '#F2F4F3',
          'cream-dk':'#E5EBE6',

          // Alertas
          rose:      '#B85C6E',
          gold:      '#B8962E',
          'gold-lt': '#D4AF42',
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

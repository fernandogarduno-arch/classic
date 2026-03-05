/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cs: {
          // ── Superficies ───────────────────────────────
          bg:          '#F5F7F5',
          surface:     '#FFFFFF',
          'surface-2': '#F0F4F1',
          cream:       '#F0F4F1',   // alias legacy
          'cream-dk':  '#E5EBE5',   // alias legacy

          // ── Sidebar ───────────────────────────────────
          sidebar:        '#15172B',
          'sidebar-hover':'#1E2240',

          // ── Texto ─────────────────────────────────────
          ink:      '#111827',
          charcoal: '#1C2A22',      // alias legacy
          secondary:'#4B5563',
          muted:    '#9CA3AF',
          'on-dark':'#E2E8DF',

          // ── Verde Oliva — acento principal ────────────
          olive:        '#3E6335',
          'olive-md':   '#4F7C44',
          'olive-lt':   '#6B9460',
          'olive-bg':   '#EBF2E9',
          'olive-border':'#C5D9C0',

          // ── Alias legacy (dorado → oliva) ─────────────
          gold:     '#4F7C44',      // redirige a olive-md
          'gold-lt':'#6B9460',

          // ── Bordes ────────────────────────────────────
          border:    '#E2E8E2',
          'border-dk':'#C8D4C8',

          // ── Semánticos ────────────────────────────────
          rose:    '#B34C60',
          amber:   '#B07D1A',
          emerald: '#256B47',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover':'0 2px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08)',
        modal:      '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

import { useAppAuth } from './useAppAuth'

export default function AppLogin() {
  const { signInGoogle } = useAppAuth()

  return (
    <div className="app-shell flex flex-col" style={{ background: 'white' }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #4F7C44, #2D4A26)' }}>
          <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 32, color: 'white', fontWeight: 700, lineHeight: 1 }}>C</span>
        </div>

        <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 36, color: '#111', fontWeight: 600, textAlign: 'center',
          letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.15 }}>
          Classic Studio
        </h1>
        <p style={{ fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginBottom: 48, lineHeight: 1.6 }}>
          Reserva tus clases, sigue tu<br />progreso y más.
        </p>

        {/* Testimonios mini */}
        <div className="w-full space-y-3 mb-10">
          {[
            { name: 'Ana M.', text: 'Me encanta reservar desde aquí 🌿' },
            { name: 'Sofía R.', text: 'Tan fácil de usar y muy bonita 💚' },
          ].map(t => (
            <div key={t.name} className="app-card px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: '#4F7C44' }}>{t.name[0]}</div>
              <div>
                <p style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{t.name}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>{t.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Google */}
        <button onClick={signInGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium transition-all"
          style={{ border: '1.5px solid #E5E5E0', background: 'white', fontSize: 15,
            color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F9F9F7'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
          </svg>
          Continuar con Google
        </button>

        <p style={{ fontSize: 12, color: '#C4C4BC', textAlign: 'center', marginTop: 16 }}>
          Al continuar aceptas los términos de uso.
        </p>
      </div>
    </div>
  )
}

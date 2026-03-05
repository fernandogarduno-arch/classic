import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(email, password)
    if (error) setError('Correo o contraseña incorrectos.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14"
        style={{ backgroundColor: '#15172B' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4F7C44, #3E6335)' }}>
            <span className="font-display text-white font-bold" style={{ fontSize: 17 }}>C</span>
          </div>
          <span className="font-display text-white tracking-wide" style={{ fontSize: 18 }}>Classic Studio</span>
        </div>

        <div>
          <p className="label-caps mb-6" style={{ color: 'rgba(226,232,223,0.35)' }}>
            Plataforma de administración
          </p>
          <h1 className="font-display text-white leading-tight mb-5" style={{ fontSize: 44, letterSpacing: '-0.02em' }}>
            Control total<br />
            <span style={{ color: '#6B9460' }}>de tu estudio</span><br />
            en un solo lugar.
          </h1>
          <p className="leading-relaxed" style={{ color: 'rgba(226,232,223,0.4)', fontSize: 14, maxWidth: 320 }}>
            Clientes, agenda, instructoras, nómina y cumplimiento gestionados desde una sola plataforma.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['Clientes activos', 'Ocupación prom.', 'Churn rate'].map(s => (
            <div key={s} className="rounded-xl p-4"
              style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <p className="font-display" style={{ color: '#6B9460', fontSize: 24 }}>—</p>
              <p style={{ color: 'rgba(226,232,223,0.3)', fontSize: 11, marginTop: 4 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#F5F7F5' }}>
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#15172B' }}>
              <span className="font-display text-white font-bold" style={{ fontSize: 15 }}>C</span>
            </div>
            <span className="font-display text-cs-charcoal" style={{ fontSize: 18 }}>Classic Studio</span>
          </div>

          <h2 className="font-display mb-1" style={{ fontSize: 30, color: '#111827', letterSpacing: '-0.02em' }}>
            Bienvenido
          </h2>
          <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>Ingresa con tu cuenta del equipo</p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                Correo electrónico
              </label>
              <input type="email" className="input" placeholder="hola@classicstudio.mx"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                Contraseña
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9CA3AF' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: loading ? '#6B9460' : '#3E6335', fontSize: 14,
                boxShadow: '0 1px 3px rgba(62,99,53,0.3)', letterSpacing: '0.01em' }}>
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center mt-8" style={{ fontSize: 12, color: '#9CA3AF' }}>
            ¿Problemas de acceso? Contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

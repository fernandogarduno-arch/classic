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
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError('Correo o contraseña incorrectos.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cs-cream flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-cs-charcoal flex-col justify-between p-16">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-cs-gold flex items-center justify-center">
              <span className="font-display text-cs-charcoal text-xl font-bold">C</span>
            </div>
            <span className="font-display text-white text-2xl tracking-wide">Classic Studio</span>
          </div>
          <h1 className="font-display text-white text-5xl leading-tight mb-6">
            El centro de<br />
            <span className="text-cs-gold">control total</span><br />
            de tu estudio.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Gestiona clientes, agenda, instructoras, nómina y cumplimiento desde un solo lugar.
          </p>
        </div>
        {/* Stat decorativa */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Clientes activos', value: '—' },
            { label: 'Ocupación prom.', value: '—' },
            { label: 'Churn rate', value: '—' },
          ].map(s => (
            <div key={s.label} className="border border-white/10 rounded-xl p-4">
              <p className="font-display text-cs-gold text-2xl">{s.value}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-cs-charcoal flex items-center justify-center">
              <span className="font-display text-cs-gold text-lg font-bold">C</span>
            </div>
            <span className="font-display text-cs-charcoal text-xl">Classic Studio</span>
          </div>

          <h2 className="font-display text-3xl text-cs-charcoal mb-1">Bienvenido de vuelta</h2>
          <p className="text-cs-muted text-sm mb-8">Accede con tu cuenta del equipo</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-cs-charcoal mb-1.5">Correo electrónico</label>
              <input
                type="email"
                className="input"
                placeholder="hola@classicstudio.mx"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cs-charcoal mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cs-muted hover:text-cs-charcoal"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cs-charcoal text-white py-3 rounded-lg font-medium text-sm hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-cs-muted mt-8">
            ¿Problemas para acceder? Contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

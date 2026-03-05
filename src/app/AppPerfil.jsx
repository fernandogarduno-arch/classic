import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppAuth } from './useAppAuth'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, User, Phone, Mail, Shield, Star } from 'lucide-react'

export default function AppPerfil() {
  const { cliente, setCliente, signOut, session } = useAppAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm]       = useState({
    nombre:    cliente?.nombre ?? '',
    apellidos: cliente?.apellidos ?? '',
    telefono:  cliente?.telefono ?? '',
  })

  async function guardar() {
    setSaving(true)
    await supabase.from('clientes')
      .update({ nombre: form.nombre, apellidos: form.apellidos, telefono: form.telefono })
      .eq('id', cliente.id)
    setCliente(c => ({ ...c, ...form }))
    setSaving(false)
    setEditing(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/app')
  }

  const avatar = session?.user?.user_metadata?.avatar_url
  const email  = session?.user?.email ?? cliente?.email ?? ''

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-8 text-center"
        style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #2D4A26 100%)' }}>
        {avatar ? (
          <img src={avatar} alt="foto" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
            style={{ border: '3px solid rgba(255,255,255,0.2)' }} />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.2)' }}>
            {cliente?.nombre?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <h1 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 26, color: 'white', fontWeight: 600 }}>
          {cliente?.nombre ? `${cliente.nombre} ${cliente.apellidos ?? ''}` : 'Mi perfil'}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{email}</p>

        {/* Stats */}
        <div className="flex justify-center gap-4 mt-5">
          {[
            { val: cliente?.total_clases ?? 0, label: 'Clases' },
            { val: cliente?.status ?? 'activo', label: 'Estado' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-5 py-2.5 text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 22, color: 'white', lineHeight: 1 }}>
                {s.val}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Datos personales */}
        <div className="app-card p-4">
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Datos personales</p>
            <button onClick={() => { setEditing(!editing); setForm({ nombre: cliente?.nombre ?? '', apellidos: cliente?.apellidos ?? '', telefono: cliente?.telefono ?? '' }) }}
              style={{ fontSize: 13, color: '#3E6335', fontWeight: 500 }}>
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Nombre</p>
                <input className="app-input" value={form.nombre}
                  onChange={e => setForm(f => ({...f, nombre: e.target.value}))} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Apellidos</p>
                <input className="app-input" value={form.apellidos}
                  onChange={e => setForm(f => ({...f, apellidos: e.target.value}))} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Teléfono</p>
                <input className="app-input" value={form.telefono}
                  onChange={e => setForm(f => ({...f, telefono: e.target.value}))} />
              </div>
              <button onClick={guardar} disabled={saving}
                className="w-full app-btn app-btn-primary mt-1">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: User,   label: 'Nombre',   val: `${cliente?.nombre ?? ''} ${cliente?.apellidos ?? ''}` },
                { icon: Phone,  label: 'Teléfono', val: cliente?.telefono ?? '—' },
                { icon: Mail,   label: 'Email',    val: email },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#F5F5F2' }}>
                    <Icon size={14} style={{ color: '#9CA3AF' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</p>
                    <p style={{ fontSize: 14, color: '#111' }}>{val.trim() || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mi membresía */}
        <div className="app-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#EBF2E9' }}>
              <Star size={14} style={{ color: '#3E6335' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Mi membresía</p>
          </div>
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: '#F5F7F5' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Plan actual</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                {cliente?.total_clases ?? 0} clases tomadas
              </p>
            </div>
            <span className="clase-pill" style={{ backgroundColor: '#EBF2E9', color: '#3E6335' }}>
              {cliente?.status ?? 'activo'}
            </span>
          </div>
        </div>

        {/* Privacidad */}
        <div className="app-card divide-y" style={{ borderColor: '#EEEDE9' }}>
          {[
            { icon: Shield, label: 'Privacidad y seguridad' },
          ].map(({ icon: Icon, label }) => (
            <button key={label}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <div className="flex items-center gap-3">
                <Icon size={16} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: 14, color: '#111' }}>{label}</span>
              </div>
              <ChevronRight size={15} style={{ color: '#C4C4BC' }} />
            </button>
          ))}
        </div>

        {/* Cerrar sesión */}
        <button onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all"
          style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA',
            color: '#991B1B', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

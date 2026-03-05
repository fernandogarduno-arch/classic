import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppAuth } from './useAppAuth'
import { format, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Clock, Users } from 'lucide-react'

export default function AppHome() {
  const { cliente } = useAppAuth()
  const navigate    = useNavigate()
  const [sesiones, setSesiones]     = useState([])
  const [misReservas, setMisReservas] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [{ data: ses }, { data: res }] = await Promise.all([
        supabase.from('sesiones')
          .select('id,fecha,hora_inicio,hora_fin,capacidad_max,reservas_count,tipos_clase(nombre,color_hex),instructoras(nombre)')
          .eq('fecha', today).eq('cancelada', false).order('hora_inicio').limit(6),
        supabase.from('reservas')
          .select('sesion_id,status')
          .eq('cliente_id', cliente?.id)
          .neq('status', 'cancelada'),
      ])
      setSesiones(ses ?? [])
      setMisReservas(res ?? [])
      setLoading(false)
    }
    if (cliente?.id) load()
  }, [cliente])

  const reservadasIds = new Set(misReservas.map(r => r.sesion_id))
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = cliente?.nombre?.split(' ')[0] ?? ''

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6"
        style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #2D4A26 100%)' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <h1 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 30, color: 'white',
          fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 16 }}>
          {saludo}{nombre ? `, ${nombre}` : ''} 🌿
        </h1>
        {/* Stat rápida */}
        <div className="flex gap-3">
          {[
            { label: 'Clases tomadas', value: cliente?.total_clases ?? 0 },
            { label: 'Reservas activas', value: misReservas.length },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
              <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 26, color: 'white', lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* CTA reservar */}
        <button onClick={() => navigate('/app/reservar')}
          className="w-full app-card flex items-center justify-between px-5 py-4"
          style={{ textAlign: 'left', cursor: 'pointer' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#EBF2E9' }}>
              <Calendar size={18} style={{ color: '#3E6335' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Reservar una clase</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>Ver horarios disponibles</p>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: '#C4C4BC' }} />
        </button>

        {/* Clases de hoy */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Hoy
            </p>
            <button onClick={() => navigate('/app/reservar')}
              style={{ fontSize: 12, color: '#3E6335', fontWeight: 500 }}>
              Ver todo
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#3E6335', borderTopColor: 'transparent' }} />
            </div>
          ) : sesiones.length === 0 ? (
            <div className="app-card p-6 text-center">
              <p style={{ fontSize: 28, marginBottom: 6 }}>🗓️</p>
              <p style={{ fontSize: 14, color: '#9CA3AF' }}>Sin clases programadas hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sesiones.map(s => {
                const llena  = s.reservas_count >= s.capacidad_max
                const yaRsv  = reservadasIds.has(s.id)
                const color  = s.tipos_clase?.color_hex ?? '#3E6335'
                const pct    = Math.min(Math.round((s.reservas_count / s.capacidad_max) * 100), 100)

                return (
                  <div key={s.id} className="app-card overflow-hidden">
                    <div className="h-1" style={{ backgroundColor: color }} />
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                            {s.tipos_clase?.nombre}
                          </p>
                          <p style={{ fontSize: 12, color: '#9CA3AF' }}>{s.instructoras?.nombre}</p>
                        </div>
                        {yaRsv ? (
                          <span className="clase-pill"
                            style={{ backgroundColor: '#EBF2E9', color: '#3E6335' }}>
                            ✓ Reservada
                          </span>
                        ) : llena ? (
                          <span className="clase-pill"
                            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                            Lista espera
                          </span>
                        ) : (
                          <button onClick={() => navigate('/app/reservar')}
                            className="clase-pill"
                            style={{ backgroundColor: '#3E6335', color: 'white', cursor: 'pointer', border: 'none' }}>
                            Reservar
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4" style={{ fontSize: 12, color: '#9CA3AF' }}>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {s.hora_inicio?.slice(0,5)}–{s.hora_fin?.slice(0,5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {s.reservas_count}/{s.capacidad_max}
                        </span>
                      </div>
                      {/* Barra de ocupación */}
                      <div className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: '#F0F4F1' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 90 ? '#B34C60' : pct >= 70 ? '#B07D1A' : '#4F7C44'
                          }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

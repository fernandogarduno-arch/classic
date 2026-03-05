import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppAuth } from './useAppAuth'
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Users, CheckCircle, X } from 'lucide-react'

const DIAS = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

export default function AppReservar() {
  const { cliente }       = useAppAuth()
  const [diaActivo, setDia] = useState(DIAS[0])
  const [sesiones, setSesiones]       = useState([])
  const [misReservas, setMisReservas] = useState([])
  const [loading, setLoading]         = useState(true)
  const [reservando, setReservando]   = useState(null) // sesion_id
  const [toast, setToast]             = useState(null) // {msg, ok}

  useEffect(() => { loadSesiones() }, [diaActivo])
  useEffect(() => { if (cliente?.id) loadMisReservas() }, [cliente])

  async function loadSesiones() {
    setLoading(true)
    const fecha = format(diaActivo, 'yyyy-MM-dd')
    const { data } = await supabase.from('sesiones')
      .select('id,fecha,hora_inicio,hora_fin,capacidad_max,reservas_count,tipos_clase(nombre,color_hex,descripcion),instructoras(nombre,foto_url)')
      .eq('fecha', fecha).eq('cancelada', false).order('hora_inicio')
    setSesiones(data ?? [])
    setLoading(false)
  }

  async function loadMisReservas() {
    const { data } = await supabase.from('reservas')
      .select('sesion_id,status,id')
      .eq('cliente_id', cliente.id)
      .neq('status','cancelada')
    setMisReservas(data ?? [])
  }

  async function reservar(sesion) {
    if (!cliente?.id) return
    setReservando(sesion.id)
    const llena = sesion.reservas_count >= sesion.capacidad_max
    const { error } = await supabase.from('reservas').insert({
      sesion_id:   sesion.id,
      cliente_id:  cliente.id,
      status:      llena ? 'lista_espera' : 'confirmada',
      en_lista_espera: llena,
    })
    setReservando(null)
    if (error) {
      setToast({ msg: 'No se pudo reservar. Intenta de nuevo.', ok: false })
    } else {
      setToast({ msg: llena ? 'Agregada a lista de espera 🕐' : '¡Clase reservada! ✓', ok: true })
      loadMisReservas(); loadSesiones()
    }
    setTimeout(() => setToast(null), 3000)
  }

  async function cancelar(reservaId, sesionId) {
    await supabase.from('reservas').update({ status: 'cancelada' }).eq('id', reservaId)
    setToast({ msg: 'Reservación cancelada', ok: true })
    setTimeout(() => setToast(null), 3000)
    loadMisReservas(); loadSesiones()
  }

  const reservaMap = Object.fromEntries(misReservas.map(r => [r.sesion_id, r]))

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ backgroundColor: 'white', borderBottom: '1px solid #EEEDE9' }}>
        <h1 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 28, color: '#111',
          fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Reservar clase
        </h1>

        {/* Selector de días */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
          {DIAS.map(d => {
            const sel = isSameDay(d, diaActivo)
            const hoy = isSameDay(d, new Date())
            return (
              <button key={d.toString()} onClick={() => setDia(d)}
                className="flex flex-col items-center shrink-0 rounded-xl px-3 py-2 transition-all"
                style={{
                  backgroundColor: sel ? '#3E6335' : 'white',
                  border: sel ? 'none' : '1.5px solid #EEEDE9',
                  minWidth: 52,
                }}>
                <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase',
                  color: sel ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                  {hoy ? 'Hoy' : format(d, 'EEE', { locale: es })}
                </span>
                <span style={{ fontSize: 18, fontFamily: '"Cormorant Garamond",serif',
                  fontWeight: 600, color: sel ? 'white' : '#111', lineHeight: 1.3 }}>
                  {format(d, 'd')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#3E6335', borderTopColor: 'transparent' }} />
          </div>
        ) : sesiones.length === 0 ? (
          <div className="app-card p-8 text-center">
            <p style={{ fontSize: 28, marginBottom: 8 }}>🌙</p>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>Sin clases este día</p>
          </div>
        ) : sesiones.map(s => {
          const llena  = s.reservas_count >= s.capacidad_max
          const reserva = reservaMap[s.id]
          const yaRsv  = !!reserva
          const espera = reserva?.status === 'lista_espera'
          const color  = s.tipos_clase?.color_hex ?? '#3E6335'
          const pct    = Math.min(Math.round((s.reservas_count / s.capacidad_max) * 100), 100)
          const spots  = s.capacidad_max - s.reservas_count

          return (
            <div key={s.id} className="app-card overflow-hidden">
              <div className="h-1" style={{ backgroundColor: color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 2 }}>
                      {s.tipos_clase?.nombre}
                    </p>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>con {s.instructoras?.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                      {s.hora_inicio?.slice(0,5)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>–{s.hora_fin?.slice(0,5)}</p>
                  </div>
                </div>

                {/* Barra */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0F4F1' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 90 ? '#B34C60' : pct >= 70 ? '#B07D1A' : '#4F7C44'
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: llena ? '#B34C60' : '#9CA3AF', minWidth: 60, textAlign: 'right' }}>
                    {llena ? 'Llena' : `${spots} lugares`}
                  </span>
                </div>

                {/* Acción */}
                {yaRsv ? (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: espera ? '#FFF7ED' : '#EBF2E9' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: espera ? '#9A3412' : '#3E6335' }}>
                      {espera ? '🕐 En lista de espera' : '✓ Reservada'}
                    </span>
                    <button onClick={() => cancelar(reserva.id, s.id)}
                      style={{ fontSize: 12, color: '#9CA3AF' }}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => reservar(s)}
                    disabled={reservando === s.id}
                    className="w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      fontSize: 14,
                      backgroundColor: llena ? '#F5F5F2' : '#3E6335',
                      color: llena ? '#9CA3AF' : 'white',
                      border: llena ? '1.5px solid #EEEDE9' : 'none',
                    }}>
                    {reservando === s.id
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : llena ? 'Unirse a lista de espera' : 'Reservar lugar'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium"
          style={{
            backgroundColor: toast.ok ? '#1C2A22' : '#991B1B',
            color: 'white', maxWidth: 320, textAlign: 'center',
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppAuth } from './useAppAuth'
import { format, parseISO, isFuture, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, ChevronRight } from 'lucide-react'

const TABS = [{ key: 'proximas', label: 'Próximas' }, { key: 'historial', label: 'Historial' }]

export default function AppMisClases() {
  const { cliente }       = useAppAuth()
  const [tab, setTab]     = useState('proximas')
  const [reservas, setReservas] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!cliente?.id) return
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('reservas')
        .select(`id,status,en_lista_espera,created_at,
          sesiones(id,fecha,hora_inicio,hora_fin,tipos_clase(nombre,color_hex),instructoras(nombre))`)
        .eq('cliente_id', cliente.id)
        .neq('status','cancelada')
        .order('created_at', { ascending: false })
      setReservas(data ?? [])
      setLoading(false)
    }
    load()
  }, [cliente])

  const proximas  = reservas.filter(r => r.sesiones?.fecha && isFuture(new Date(r.sesiones.fecha + 'T23:59')))
  const historial = reservas.filter(r => r.sesiones?.fecha && isPast(new Date(r.sesiones.fecha + 'T00:00')))
  const lista     = tab === 'proximas' ? proximas : historial

  return (
    <div className="pb-24">
      <div className="px-5 pt-14 pb-4" style={{ backgroundColor: 'white', borderBottom: '1px solid #EEEDE9' }}>
        <h1 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: 28, color: '#111',
          fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Mis clases
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F5F2', width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? '#111' : '#9CA3AF',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
              {t.key === 'proximas' && proximas.length > 0 && (
                <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: '#3E6335', color: 'white' }}>
                  {proximas.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#3E6335', borderTopColor: 'transparent' }} />
          </div>
        ) : lista.length === 0 ? (
          <div className="app-card p-10 text-center">
            <p style={{ fontSize: 32, marginBottom: 8 }}>{tab === 'proximas' ? '📅' : '🌿'}</p>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>
              {tab === 'proximas' ? 'No tienes clases próximas' : 'Sin historial de clases'}
            </p>
          </div>
        ) : lista.map(r => {
          const s     = r.sesiones
          const color = s?.tipos_clase?.color_hex ?? '#3E6335'
          const esEsp = r.en_lista_espera
          return (
            <div key={r.id} className="app-card overflow-hidden">
              <div className="h-1" style={{ backgroundColor: color }} />
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Fecha bloque */}
                <div className="shrink-0 rounded-xl px-3 py-2 text-center"
                  style={{ backgroundColor: color + '15', minWidth: 52 }}>
                  <p style={{ fontSize: 18, fontFamily: '"Cormorant Garamond",serif',
                    fontWeight: 600, color, lineHeight: 1 }}>
                    {s?.fecha ? format(parseISO(s.fecha), 'd') : '—'}
                  </p>
                  <p style={{ fontSize: 10, color, fontWeight: 500, textTransform: 'uppercase' }}>
                    {s?.fecha ? format(parseISO(s.fecha), 'MMM', { locale: es }) : ''}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
                      {s?.tipos_clase?.nombre}
                    </p>
                    {esEsp && (
                      <span className="clase-pill" style={{ backgroundColor: '#FFF7ED', color: '#9A3412', fontSize: 10 }}>
                        Espera
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {s?.instructoras?.nombre} · {s?.hora_inicio?.slice(0,5)}–{s?.hora_fin?.slice(0,5)}
                  </p>
                  {s?.fecha && (
                    <p style={{ fontSize: 11, color: '#C4C4BC', marginTop: 2 }}>
                      {format(parseISO(s.fecha), "EEEE", { locale: es })}
                    </p>
                  )}
                </div>

                {tab === 'historial' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#EBF2E9' }}>
                    <span style={{ fontSize: 14 }}>✓</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

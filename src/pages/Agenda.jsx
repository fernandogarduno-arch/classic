import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { ChevronLeft, ChevronRight, Plus, Users, Clock } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const HORAS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','17:00','18:00','19:00','20:00']

export default function Agenda() {
  const [semana, setSemana] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sesiones, setSesiones] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const desde = format(semana, 'yyyy-MM-dd')
      const hasta = format(addDays(semana, 6), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('sesiones')
        .select(`
          id, fecha, hora_inicio, hora_fin, capacidad_max, reservas_count, cancelada,
          tipos_clase(nombre, color_hex),
          instructoras(nombre)
        `)
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .eq('cancelada', false)
        .order('hora_inicio')
      setSesiones(data ?? [])
      setLoading(false)
    }
    load()
  }, [semana])

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i))

  function getSesionesForSlot(dia, hora) {
    return sesiones.filter(s =>
      isSameDay(new Date(s.fecha + 'T00:00:00'), dia) &&
      s.hora_inicio?.startsWith(hora.slice(0, 5))
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Vista semanal de clases"
        actions={
          <button className="btn-primary"><Plus size={15} /> Nueva clase</button>
        }
      />

      {/* Navegación semana */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSemana(s => subWeeks(s, 1))} className="btn-ghost">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium text-cs-charcoal min-w-[220px] text-center">
          {format(semana, "d 'de' MMMM", { locale: es })} — {format(addDays(semana, 6), "d 'de' MMMM yyyy", { locale: es })}
        </p>
        <button onClick={() => setSemana(s => addWeeks(s, 1))} className="btn-ghost">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setSemana(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-cs-gold hover:underline">
          Hoy
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-cs-border">
                <th className="w-16 py-3 px-3 text-cs-muted font-medium text-left">Hora</th>
                {dias.map(dia => (
                  <th key={dia} className={`py-3 px-2 font-medium text-center ${isSameDay(dia, new Date()) ? 'text-cs-gold' : 'text-cs-charcoal'}`}>
                    <p className="uppercase tracking-wide">{format(dia, 'EEE', { locale: es })}</p>
                    <p className={`text-lg font-display mt-0.5 ${isSameDay(dia, new Date()) ? 'bg-cs-gold text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                      {format(dia, 'd')}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map(hora => (
                <tr key={hora} className="border-b border-cs-border/50 h-20">
                  <td className="px-3 py-2 text-cs-muted align-top pt-2">{hora}</td>
                  {dias.map(dia => {
                    const slots = getSesionesForSlot(dia, hora)
                    return (
                      <td key={dia} className="px-1 py-1 align-top">
                        {slots.map(s => {
                          const occ = s.capacidad_max > 0 ? Math.round((s.reservas_count / s.capacidad_max) * 100) : 0
                          return (
                            <div
                              key={s.id}
                              className="rounded-lg p-1.5 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: (s.tipos_clase?.color_hex ?? '#B5703A') + '22', borderLeft: `3px solid ${s.tipos_clase?.color_hex ?? '#B5703A'}` }}
                            >
                              <p className="font-semibold text-cs-charcoal leading-tight">{s.tipos_clase?.nombre}</p>
                              <p className="text-cs-muted mt-0.5">{s.instructoras?.nombre}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users size={10} className="text-cs-muted" />
                                <span className={`${occ >= 90 ? 'text-cs-rose' : occ >= 70 ? 'text-amber-600' : 'text-cs-muted'}`}>
                                  {s.reservas_count}/{s.capacidad_max}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

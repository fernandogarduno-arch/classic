import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { ChevronLeft, ChevronRight, Plus, Users, X } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const HORAS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','17:00','18:00','19:00','20:00']

const FORM_INIT = {
  tipo_clase_id: '',
  instructora_id: '',
  espacio_id: '',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  hora_inicio: '09:00',
  hora_fin: '10:00',
  capacidad_max: '',
}

export default function Agenda() {
  const [semana, setSemana]       = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sesiones, setSesiones]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState(FORM_INIT)
  const [error, setError]         = useState('')

  // Datos para los selects
  const [tiposClase, setTiposClase]     = useState([])
  const [instructoras, setInstructoras] = useState([])
  const [espacios, setEspacios]         = useState([])

  useEffect(() => {
    // Cargar datos estáticos para los selects una sola vez
    Promise.all([
      supabase.from('tipos_clase').select('id, nombre, color_hex, duracion_min').eq('activo', true).order('nombre'),
      supabase.from('instructoras').select('id, nombre, apellidos, color_hex').eq('activa', true).order('nombre'),
      supabase.from('espacios').select('id, nombre, capacidad').eq('activo', true).order('nombre'),
    ]).then(([tc, inst, esp]) => {
      setTiposClase(tc.data ?? [])
      setInstructoras(inst.data ?? [])
      setEspacios(esp.data ?? [])
    })
  }, [])

  useEffect(() => { loadSesiones() }, [semana])

  async function loadSesiones() {
    setLoading(true)
    const desde = format(semana, 'yyyy-MM-dd')
    const hasta = format(addDays(semana, 6), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('sesiones')
      .select(`id, fecha, hora_inicio, hora_fin, capacidad_max, reservas_count, cancelada,
        tipos_clase(nombre, color_hex), instructoras(nombre)`)
      .gte('fecha', desde).lte('fecha', hasta)
      .eq('cancelada', false).order('hora_inicio')
    setSesiones(data ?? [])
    setLoading(false)
  }

  // Al cambiar tipo de clase, auto-calcular hora_fin según duración
  function handleTipoChange(tipo_id) {
    const tipo = tiposClase.find(t => t.id === tipo_id)
    if (tipo) {
      const [h, m] = form.hora_inicio.split(':').map(Number)
      const total  = h * 60 + m + tipo.duracion_min
      const hf = String(Math.floor(total / 60)).padStart(2, '0')
      const mf = String(total % 60).padStart(2, '0')
      setForm(f => ({ ...f, tipo_clase_id: tipo_id, hora_fin: `${hf}:${mf}` }))
    } else {
      setForm(f => ({ ...f, tipo_clase_id: tipo_id }))
    }
  }

  // Al cambiar espacio, auto-rellenar capacidad
  function handleEspacioChange(esp_id) {
    const esp = espacios.find(e => e.id === esp_id)
    setForm(f => ({ ...f, espacio_id: esp_id, capacidad_max: esp ? String(esp.capacidad) : f.capacidad_max }))
  }

  async function crearSesion() {
    setError('')
    if (!form.tipo_clase_id || !form.instructora_id || !form.espacio_id || !form.fecha) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('sesiones').insert({
      tipo_clase_id:  form.tipo_clase_id,
      instructora_id: form.instructora_id,
      espacio_id:     form.espacio_id,
      fecha:          form.fecha,
      hora_inicio:    form.hora_inicio + ':00',
      hora_fin:       form.hora_fin    + ':00',
      capacidad_max:  parseInt(form.capacidad_max) || 10,
    })
    setSaving(false)
    if (err) { setError('Error al guardar: ' + err.message); return }
    setShowModal(false)
    setForm(FORM_INIT)
    loadSesiones()
  }

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
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Nueva clase
          </button>
        }
      />

      {/* Navegación semana */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSemana(s => subWeeks(s, 1))} className="btn-ghost"><ChevronLeft size={16} /></button>
        <p className="text-sm font-medium text-cs-charcoal min-w-[220px] text-center">
          {format(semana, "d 'de' MMMM", { locale: es })} — {format(addDays(semana, 6), "d 'de' MMMM yyyy", { locale: es })}
        </p>
        <button onClick={() => setSemana(s => addWeeks(s, 1))} className="btn-ghost"><ChevronRight size={16} /></button>
        <button onClick={() => setSemana(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-cs-gold hover:underline">Hoy</button>
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
                      <td key={String(dia)} className="px-1 py-1 align-top">
                        {slots.map(s => {
                          const occ = s.capacidad_max > 0 ? Math.round((s.reservas_count / s.capacidad_max) * 100) : 0
                          return (
                            <div key={s.id} className="rounded-lg p-1.5 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: (s.tipos_clase?.color_hex ?? '#B5703A') + '22', borderLeft: `3px solid ${s.tipos_clase?.color_hex ?? '#B5703A'}` }}>
                              <p className="font-semibold text-cs-charcoal leading-tight">{s.tipos_clase?.nombre}</p>
                              <p className="text-cs-muted mt-0.5">{s.instructoras?.nombre}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users size={10} className="text-cs-muted" />
                                <span className={occ >= 90 ? 'text-cs-rose' : occ >= 70 ? 'text-amber-600' : 'text-cs-muted'}>
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

      {/* ── MODAL NUEVA CLASE ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl text-cs-charcoal">Nueva clase</h3>
              <button onClick={() => { setShowModal(false); setError('') }} className="text-cs-muted hover:text-cs-charcoal">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-4">{error}</div>
            )}

            <div className="space-y-4">
              {/* Tipo de clase */}
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Tipo de clase *</label>
                <select className="input" value={form.tipo_clase_id} onChange={e => handleTipoChange(e.target.value)}>
                  <option value="">Selecciona una clase</option>
                  {tiposClase.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.duracion_min} min)</option>
                  ))}
                </select>
              </div>

              {/* Instructora */}
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Instructora *</label>
                <select className="input" value={form.instructora_id} onChange={e => setForm(f => ({ ...f, instructora_id: e.target.value }))}>
                  <option value="">Selecciona instructora</option>
                  {instructoras.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} {i.apellidos}</option>
                  ))}
                </select>
              </div>

              {/* Espacio */}
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Espacio *</label>
                <select className="input" value={form.espacio_id} onChange={e => handleEspacioChange(e.target.value)}>
                  <option value="">Selecciona espacio</option>
                  {espacios.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} (cap. {e.capacidad})</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Fecha *</label>
                <input type="date" className="input" value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>

              {/* Hora inicio / fin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Hora inicio</label>
                  <input type="time" className="input" value={form.hora_inicio}
                    onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Hora fin</label>
                  <input type="time" className="input" value={form.hora_fin}
                    onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
                </div>
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Capacidad máxima</label>
                <input type="number" className="input" min="1" max="50" value={form.capacidad_max}
                  placeholder="Se toma del espacio seleccionado"
                  onChange={e => setForm(f => ({ ...f, capacidad_max: e.target.value }))} />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button className="btn-ghost flex-1" onClick={() => { setShowModal(false); setError('') }}>Cancelar</button>
                <button className="btn-primary flex-1 justify-center" onClick={crearSesion} disabled={saving}>
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Guardando…' : 'Crear clase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

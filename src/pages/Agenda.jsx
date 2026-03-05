import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { ChevronLeft, ChevronRight, Plus, Users, X, AlertTriangle, RefreshCw, Repeat } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const HORAS    = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','17:00','18:00','19:00','20:00']
const DIAS_SEM = [
  { label: 'L', full: 'Lunes',     value: 1 },
  { label: 'M', full: 'Martes',    value: 2 },
  { label: 'X', full: 'Miércoles', value: 3 },
  { label: 'J', full: 'Jueves',    value: 4 },
  { label: 'V', full: 'Viernes',   value: 5 },
  { label: 'S', full: 'Sábado',    value: 6 },
  { label: 'D', full: 'Domingo',   value: 0 },
]

const FORM_INIT = {
  tipo_clase_id: '', instructora_id: '', espacio_id: '',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  hora_inicio: '09:00', hora_fin: '10:00', capacidad_max: '',
  // recurrencia
  es_recurrente: false,
  dias_semana: [],
  fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
  fecha_fin: '',
}

// Genera array de fechas entre fecha_inicio y fecha_fin que caen en los días indicados
function generarFechas(fecha_inicio, fecha_fin, dias_semana) {
  const fechas = []
  const limite = fecha_fin ? parseISO(fecha_fin) : addWeeks(parseISO(fecha_inicio), 8)
  let cur = parseISO(fecha_inicio)
  while (cur <= limite) {
    if (dias_semana.includes(cur.getDay())) fechas.push(format(cur, 'yyyy-MM-dd'))
    cur = addDays(cur, 1)
  }
  return fechas
}

// Modal de cancelar/editar desde una fecha
function ModalAccionFutura({ sesion, onCancelarDesde, onCerrar, procesando }) {
  const [fecha, setFecha] = useState(sesion.fecha)
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl" style={{ color: '#111827' }}>Cancelar ocurrencias</h3>
          <button onClick={onCerrar} style={{ color: '#9CA3AF' }}><X size={17} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: '#4B5563' }}>
          Cancelar <strong>{sesion.tipos_clase?.nombre}</strong> desde:
        </p>
        <input type="date" className="input mb-4" value={fecha}
          min={sesion.fecha}
          onChange={e => setFecha(e.target.value)} />
        <div className="rounded-lg p-3 mb-4 flex items-start gap-2"
          style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <AlertTriangle size={14} style={{ color: '#9A3412', marginTop: 1, shrink: 0 }} />
          <p style={{ fontSize: 12, color: '#9A3412' }}>
            Se cancelarán todas las sesiones de esta clase desde la fecha seleccionada hasta el fin de la plantilla.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onCerrar}>Volver</button>
          <button
            onClick={() => onCancelarDesde(sesion.plantilla_id, fecha)}
            disabled={procesando}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#B34C60' }}>
            {procesando
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Cancelar desde esta fecha'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Agenda() {
  const [semana, setSemana]         = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sesiones, setSesiones]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [sesionAcc, setSesionAcc]   = useState(null) // sesión recurrente seleccionada para acción
  const [saving, setSaving]         = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [form, setForm]             = useState(FORM_INIT)
  const [error, setError]           = useState('')
  const [tiposClase, setTiposClase]   = useState([])
  const [instructoras, setInstructoras] = useState([])
  const [espacios, setEspacios]         = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('tipos_clase').select('id,nombre,color_hex,duracion_min').eq('activo', true).order('nombre'),
      supabase.from('instructoras').select('id,nombre,apellidos,color_hex').eq('activa', true).order('nombre'),
      supabase.from('espacios').select('id,nombre,capacidad').eq('activo', true).order('nombre'),
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
      .select(`id,fecha,hora_inicio,hora_fin,capacidad_max,reservas_count,cancelada,plantilla_id,es_recurrente,
        tipos_clase(nombre,color_hex), instructoras(nombre)`)
      .gte('fecha', desde).lte('fecha', hasta)
      .eq('cancelada', false).order('hora_inicio')
    setSesiones(data ?? [])
    setLoading(false)
  }

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

  function handleEspacioChange(esp_id) {
    const esp = espacios.find(e => e.id === esp_id)
    setForm(f => ({ ...f, espacio_id: esp_id, capacidad_max: esp ? String(esp.capacidad) : f.capacidad_max }))
  }

  function toggleDia(val) {
    setForm(f => ({
      ...f,
      dias_semana: f.dias_semana.includes(val)
        ? f.dias_semana.filter(d => d !== val)
        : [...f.dias_semana, val]
    }))
  }

  async function crearSesion() {
    setError('')
    if (!form.tipo_clase_id || !form.instructora_id || !form.espacio_id) {
      setError('Tipo de clase, instructora y espacio son obligatorios.')
      return
    }

    setSaving(true)

    if (form.es_recurrente) {
      // ── Clase recurrente ──────────────────────────────
      if (form.dias_semana.length === 0) {
        setError('Selecciona al menos un día de la semana.')
        setSaving(false); return
      }

      // 1. Crear plantilla
      const { data: plantilla, error: errPl } = await supabase
        .from('plantillas_recurrentes')
        .insert({
          tipo_clase_id:  form.tipo_clase_id,
          instructora_id: form.instructora_id,
          espacio_id:     form.espacio_id,
          hora_inicio:    form.hora_inicio + ':00',
          hora_fin:       form.hora_fin    + ':00',
          capacidad_max:  parseInt(form.capacidad_max) || 10,
          dias_semana:    form.dias_semana,
          fecha_inicio:   form.fecha_inicio,
          fecha_fin:      form.fecha_fin || null,
        })
        .select('id')
        .single()

      if (errPl) { setError('Error al crear plantilla: ' + errPl.message); setSaving(false); return }

      // 2. Generar sesiones individuales
      const fechas = generarFechas(form.fecha_inicio, form.fecha_fin, form.dias_semana)
      if (fechas.length === 0) {
        setError('No hay fechas válidas en el rango seleccionado.')
        setSaving(false); return
      }

      const sesionesToInsert = fechas.map(fecha => ({
        tipo_clase_id:  form.tipo_clase_id,
        instructora_id: form.instructora_id,
        espacio_id:     form.espacio_id,
        fecha,
        hora_inicio:    form.hora_inicio + ':00',
        hora_fin:       form.hora_fin    + ':00',
        capacidad_max:  parseInt(form.capacidad_max) || 10,
        plantilla_id:   plantilla.id,
        es_recurrente:  true,
      }))

      // Insertar en lotes de 100
      for (let i = 0; i < sesionesToInsert.length; i += 100) {
        const { error: errS } = await supabase.from('sesiones').insert(sesionesToInsert.slice(i, i + 100))
        if (errS) { setError('Error al generar sesiones: ' + errS.message); setSaving(false); return }
      }

    } else {
      // ── Clase única ───────────────────────────────────
      const { error: err } = await supabase.from('sesiones').insert({
        tipo_clase_id:  form.tipo_clase_id,
        instructora_id: form.instructora_id,
        espacio_id:     form.espacio_id,
        fecha:          form.fecha,
        hora_inicio:    form.hora_inicio + ':00',
        hora_fin:       form.hora_fin    + ':00',
        capacidad_max:  parseInt(form.capacidad_max) || 10,
        es_recurrente:  false,
      })
      if (err) { setError('Error: ' + err.message); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    setForm(FORM_INIT)
    loadSesiones()
  }

  // Cancelar sesiones desde una fecha en adelante
  async function cancelarDesde(plantilla_id, desde_fecha) {
    setProcesando(true)
    await supabase
      .from('sesiones')
      .update({ cancelada: true })
      .eq('plantilla_id', plantilla_id)
      .gte('fecha', desde_fecha)
      .eq('cancelada', false)

    // Actualizar fecha_fin de la plantilla al día anterior
    const diaAnterior = format(addDays(parseISO(desde_fecha), -1), 'yyyy-MM-dd')
    await supabase
      .from('plantillas_recurrentes')
      .update({ fecha_fin: diaAnterior, activa: false })
      .eq('id', plantilla_id)

    setProcesando(false)
    setSesionAcc(null)
    loadSesiones()
  }

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i))

  function getSesionesForSlot(dia, hora) {
    return sesiones.filter(s =>
      isSameDay(new Date(s.fecha + 'T00:00:00'), dia) &&
      s.hora_inicio?.startsWith(hora.slice(0, 5))
    )
  }

  const diasLabel = form.dias_semana.length === 0 ? '—'
    : DIAS_SEM.filter(d => form.dias_semana.includes(d.value)).map(d => d.full).join(', ')

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Vista semanal de clases"
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Programar clase
          </button>
        }
      />

      {/* Navegación semana */}
      <div className="flex items-center gap-3">
        <button onClick={() => setSemana(s => subWeeks(s, 1))} className="btn-ghost px-2.5"><ChevronLeft size={16} /></button>
        <p className="text-sm font-medium min-w-[220px] text-center" style={{ color: '#1C2A22' }}>
          {format(semana, "d 'de' MMMM", { locale: es })} — {format(addDays(semana, 6), "d 'de' MMMM yyyy", { locale: es })}
        </p>
        <button onClick={() => setSemana(s => addWeeks(s, 1))} className="btn-ghost px-2.5"><ChevronRight size={16} /></button>
        <button onClick={() => setSemana(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="text-xs hover:underline" style={{ color: '#4F7C44' }}>Hoy</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#3E6335', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8E2' }}>
                <th className="w-16 py-3 px-3 text-left font-medium" style={{ color: '#9CA3AF' }}>Hora</th>
                {dias.map(dia => (
                  <th key={String(dia)} className="py-3 px-2 font-medium text-center"
                    style={{ color: isSameDay(dia, new Date()) ? '#3E6335' : '#1C2A22' }}>
                    <p className="uppercase tracking-wide" style={{ fontSize: 10 }}>
                      {format(dia, 'EEE', { locale: es })}
                    </p>
                    <p className="font-display mt-0.5 text-lg" style={isSameDay(dia, new Date())
                      ? { backgroundColor: '#3E6335', color: 'white', width: 28, height: 28,
                          borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', margin: '2px auto 0' }
                      : {}}>
                      {format(dia, 'd')}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map(hora => (
                <tr key={hora} style={{ borderBottom: '1px solid #F0F4F1', height: 80 }}>
                  <td className="px-3 py-2 align-top pt-2" style={{ color: '#9CA3AF' }}>{hora}</td>
                  {dias.map(dia => {
                    const slots = getSesionesForSlot(dia, hora)
                    return (
                      <td key={String(dia)} className="px-1 py-1 align-top">
                        {slots.map(s => {
                          const occ = s.capacidad_max > 0
                            ? Math.round((s.reservas_count / s.capacidad_max) * 100) : 0
                          const color = s.tipos_clase?.color_hex ?? '#3E6335'
                          return (
                            <div key={s.id}
                              className="rounded-lg p-1.5 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: color + '18', borderLeft: `3px solid ${color}` }}
                              onClick={() => s.es_recurrente && setSesionAcc(s)}>
                              <div className="flex items-center gap-1">
                                <p className="font-semibold leading-tight flex-1" style={{ color: '#1C2A22' }}>
                                  {s.tipos_clase?.nombre}
                                </p>
                                {s.es_recurrente && (
                                  <RefreshCw size={9} style={{ color: '#9CA3AF', shrink: 0 }} />
                                )}
                              </div>
                              <p className="mt-0.5" style={{ color: '#9CA3AF' }}>{s.instructoras?.nombre}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users size={9} style={{ color: '#9CA3AF' }} />
                                <span style={{
                                  color: occ >= 90 ? '#B34C60' : occ >= 70 ? '#B07D1A' : '#9CA3AF'
                                }}>
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

      {/* ── MODAL PROGRAMAR CLASE ───────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl" style={{ color: '#111827' }}>Programar clase</h3>
              <button onClick={() => { setShowModal(false); setError('') }}
                style={{ color: '#9CA3AF' }} className="hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-xs mb-4 flex items-center gap-2"
                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                <AlertTriangle size={13} /> {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Tipo de clase */}
              <div>
                <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                  Tipo de clase *
                </label>
                <select className="input" value={form.tipo_clase_id} onChange={e => handleTipoChange(e.target.value)}>
                  <option value="">Selecciona una clase</option>
                  {tiposClase.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.duracion_min} min)</option>
                  ))}
                </select>
              </div>

              {/* Instructora */}
              <div>
                <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                  Instructora *
                </label>
                <select className="input" value={form.instructora_id}
                  onChange={e => setForm(f => ({ ...f, instructora_id: e.target.value }))}>
                  <option value="">Selecciona instructora</option>
                  {instructoras.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} {i.apellidos}</option>
                  ))}
                </select>
              </div>

              {/* Espacio */}
              <div>
                <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                  Espacio *
                </label>
                <select className="input" value={form.espacio_id} onChange={e => handleEspacioChange(e.target.value)}>
                  <option value="">Selecciona espacio</option>
                  {espacios.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} (cap. {e.capacidad})</option>
                  ))}
                </select>
              </div>

              {/* Hora inicio / fin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                    Hora inicio
                  </label>
                  <input type="time" className="input" value={form.hora_inicio}
                    onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                    Hora fin
                  </label>
                  <input type="time" className="input" value={form.hora_fin}
                    onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
                </div>
              </div>

              {/* Capacidad */}
              <div>
                <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                  Capacidad máxima
                </label>
                <input type="number" className="input" min="1" max="50" value={form.capacidad_max}
                  placeholder="Se toma del espacio"
                  onChange={e => setForm(f => ({ ...f, capacidad_max: e.target.value }))} />
              </div>

              {/* Toggle recurrencia */}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#F5F7F5', border: '1px solid #E2E8E2' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, es_recurrente: !f.es_recurrente }))}
                    className="w-10 h-6 rounded-full relative transition-colors"
                    style={{ backgroundColor: form.es_recurrente ? '#3E6335' : '#D1D5DB' }}>
                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: form.es_recurrente ? '18px' : '2px' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1C2A22' }}>
                      <Repeat size={13} className="inline mr-1.5" style={{ color: form.es_recurrente ? '#3E6335' : '#9CA3AF' }} />
                      Clase recurrente
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      Se programa automáticamente en los días seleccionados
                    </p>
                  </div>
                </label>
              </div>

              {form.es_recurrente ? (
                <>
                  {/* Días de la semana */}
                  <div>
                    <label className="block mb-2" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                      Días de la semana *
                    </label>
                    <div className="flex gap-2">
                      {DIAS_SEM.map(d => {
                        const sel = form.dias_semana.includes(d.value)
                        return (
                          <button key={d.value} type="button" onClick={() => toggleDia(d.value)}
                            className="w-9 h-9 rounded-full text-xs font-semibold transition-all"
                            style={{
                              backgroundColor: sel ? '#3E6335' : '#F0F4F1',
                              color: sel ? 'white' : '#9CA3AF',
                              border: sel ? 'none' : '1px solid #E2E8E2',
                            }}>
                            {d.label}
                          </button>
                        )
                      })}
                    </div>
                    {form.dias_semana.length > 0 && (
                      <p className="mt-1.5" style={{ fontSize: 11, color: '#4F7C44' }}>{diasLabel}</p>
                    )}
                  </div>

                  {/* Fecha inicio / fin */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                        Fecha inicio *
                      </label>
                      <input type="date" className="input" value={form.fecha_inicio}
                        onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                        Fecha fin <span style={{ color: '#9CA3AF' }}>(opcional)</span>
                      </label>
                      <input type="date" className="input" value={form.fecha_fin}
                        min={form.fecha_inicio}
                        onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
                    </div>
                  </div>

                  {/* Preview */}
                  {form.dias_semana.length > 0 && form.fecha_inicio && (
                    <div className="rounded-lg px-3 py-2.5 text-xs"
                      style={{ backgroundColor: '#EBF2E9', border: '1px solid #C5D9C0' }}>
                      <p className="font-medium mb-0.5" style={{ color: '#3E6335' }}>Vista previa</p>
                      <p style={{ color: '#4B5563' }}>
                        {generarFechas(form.fecha_inicio, form.fecha_fin, form.dias_semana).length} sesiones
                        {form.fecha_fin ? ` hasta el ${format(parseISO(form.fecha_fin), "d 'de' MMMM yyyy", { locale: es })}` : ' (8 semanas por defecto)'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Fecha única */
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
                    Fecha *
                  </label>
                  <input type="date" className="input" value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn-ghost flex-1 justify-center"
                  onClick={() => { setShowModal(false); setError('') }}>Cancelar</button>
                <button className="btn-primary flex-1 justify-center" onClick={crearSesion} disabled={saving}>
                  {saving
                    ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando…</>
                    : form.es_recurrente ? <><Repeat size={13} /> Crear serie</> : 'Crear clase'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelar desde fecha */}
      {sesionAcc && (
        <ModalAccionFutura
          sesion={sesionAcc}
          onCancelarDesde={cancelarDesde}
          onCerrar={() => setSesionAcc(null)}
          procesando={procesando}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import {
  ChevronLeft, ChevronRight, Plus, Users, X,
  AlertTriangle, RefreshCw, Repeat, Edit, Trash2, Clock, MapPin
} from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const HORAS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','17:00','18:00','19:00','20:00']
const DIAS_SEM = [
  { label:'L', full:'Lunes',     value:1 },
  { label:'M', full:'Martes',    value:2 },
  { label:'X', full:'Miercoles', value:3 },
  { label:'J', full:'Jueves',    value:4 },
  { label:'V', full:'Viernes',   value:5 },
  { label:'S', full:'Sabado',    value:6 },
  { label:'D', full:'Domingo',   value:0 },
]
const FORM_INIT = {
  tipo_clase_id:'', instructora_id:'', espacio_id:'',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  hora_inicio:'09:00', hora_fin:'10:00', capacidad_max:'',
  es_recurrente:false, dias_semana:[],
  fecha_inicio: format(new Date(), 'yyyy-MM-dd'), fecha_fin:'',
}

const HORAS_PICKER = ['05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22']
const MINS_PICKER  = ['00','15','30','45']

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

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  return String(Math.floor(total / 60)).padStart(2,'0') + ':' + String(total % 60).padStart(2,'0')
}

/* ---- TimePicker ---------------------------------------------------------- */
function TimePicker({ label, value, onChange, propuesto = false }) {
  const parts = (value || '09:00').split(':')
  const h = parts[0] || '09'
  const m = parts[1] || '00'
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <label className="flex items-center gap-1.5 mb-1.5"
        style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
        {label}
        {propuesto && (
          <span className="px-1.5 py-0.5 rounded"
            style={{ backgroundColor:'#EBF2E9', color:'#3E6335', fontSize:10, fontWeight:500 }}>
            auto
          </span>
        )}
      </label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="input w-full flex items-center justify-between gap-2"
        style={{ cursor:'pointer', color:'#111827' }}>
        <span style={{ fontSize:17, fontWeight:700, letterSpacing:'0.04em', fontVariantNumeric:'tabular-nums' }}>
          {h}:{m}
        </span>
        <Clock size={13} style={{ color:'#9CA3AF', flexShrink:0 }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-xl p-4"
            style={{ border:'1px solid #E2E8E2', minWidth:228,
              boxShadow:'0 8px 32px rgba(0,0,0,0.13)' }}>
            <p className="label-caps mb-2">Hora</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {HORAS_PICKER.map(hh => (
                <button key={hh} type="button"
                  onClick={() => onChange(hh + ':' + m)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: hh === h ? '#3E6335' : '#F5F7F5',
                    color: hh === h ? 'white' : '#4B5563',
                    minWidth:36,
                  }}>
                  {hh}
                </button>
              ))}
            </div>
            <p className="label-caps mb-2">Minutos</p>
            <div className="flex gap-1.5">
              {MINS_PICKER.map(mm => (
                <button key={mm} type="button"
                  onClick={() => { onChange(h + ':' + mm); setOpen(false) }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: mm === m ? '#3E6335' : '#F5F7F5',
                    color: mm === m ? 'white' : '#4B5563',
                  }}>
                  :{mm}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---- Modal Detalle / Edicion -------------------------------------------- */
function ModalEvento({ sesion, instructoras, espacios, onClose, onSaved, onCancelSesion }) {
  const [modo, setModo]             = useState('ver')
  const [saving, setSaving]         = useState(false)
  const [confirmarCancel, setConfirmarCancel] = useState(false)
  const [error, setError]           = useState('')
  const [edit, setEdit]             = useState({
    instructora_id: sesion.instructora_id ?? '',
    espacio_id:     sesion.espacio_id     ?? '',
    hora_inicio:    sesion.hora_inicio?.slice(0,5) ?? '',
    hora_fin:       sesion.hora_fin?.slice(0,5)   ?? '',
    capacidad_max:  String(sesion.capacidad_max   ?? ''),
  })

  const color       = sesion.tipos_clase?.color_hex ?? '#3E6335'
  const instrNombre = instructoras.find(i => i.id === sesion.instructora_id)?.nombre
    ?? sesion.instructoras?.nombre ?? '-'
  const espNombre   = espacios.find(e => e.id === sesion.espacio_id)?.nombre ?? '-'
  const occ         = sesion.capacidad_max > 0
    ? Math.round((sesion.reservas_count / sesion.capacidad_max) * 100) : 0

  async function guardar() {
    setError('')
    if (!edit.instructora_id || !edit.espacio_id || !edit.hora_inicio || !edit.hora_fin) {
      setError('Completa todos los campos.'); return
    }
    setSaving(true)
    const payload = {
      instructora_id: edit.instructora_id,
      espacio_id:     edit.espacio_id,
      hora_inicio:    edit.hora_inicio + ':00',
      hora_fin:       edit.hora_fin    + ':00',
      capacidad_max:  parseInt(edit.capacidad_max) || sesion.capacidad_max,
    }
    if (sesion.es_recurrente && sesion.plantilla_id) {
      const [r1, r2] = await Promise.all([
        supabase.from('plantillas_recurrentes').update({
          instructora_id: edit.instructora_id, espacio_id: edit.espacio_id,
          hora_inicio: edit.hora_inicio+':00', hora_fin: edit.hora_fin+':00',
          capacidad_max: parseInt(edit.capacidad_max) || sesion.capacidad_max,
        }).eq('id', sesion.plantilla_id),
        supabase.from('sesiones').update(payload)
          .eq('plantilla_id', sesion.plantilla_id).eq('cancelada', false),
      ])
      if (r1.error || r2.error) {
        setError('Error: ' + (r1.error?.message ?? r2.error?.message))
        setSaving(false); return
      }
    } else {
      const { error: err } = await supabase.from('sesiones')
        .update(payload).eq('id', sesion.id)
      if (err) { setError('Error: ' + err.message); setSaving(false); return }
    }
    setSaving(false); onSaved()
  }

  async function cancelarSesion() {
    await supabase.from('sesiones').update({ cancelada: true }).eq('id', sesion.id)
    onCancelSesion()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="h-1.5" style={{ background: color }} />
        <div className="px-6 pt-5 pb-4 flex items-start justify-between">
          <div>
            <p className="label-caps mb-1">
              {sesion.es_recurrente ? 'Clase recurrente' : 'Clase unica'}
            </p>
            <h3 className="font-display"
              style={{ fontSize:28, color:'#111827', letterSpacing:'-0.02em', lineHeight:1 }}>
              {sesion.tipos_clase?.nombre}
            </h3>
            <p className="text-sm mt-1" style={{ color:'#9CA3AF' }}>
              {format(parseISO(sesion.fecha), "EEEE d 'de' MMMM", { locale:es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {modo === 'ver' && (
              <button onClick={() => setModo('editar')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor:'#EBF2E9', color:'#3E6335', border:'1px solid #C5D9C0' }}>
                <Edit size={12} /> Editar
              </button>
            )}
            <button onClick={onClose} style={{ color:'#9CA3AF' }}
              className="p-1 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {modo === 'ver' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon:Clock,  label:'Horario',    val: (sesion.hora_inicio?.slice(0,5) ?? '') + ' - ' + (sesion.hora_fin?.slice(0,5) ?? '') },
                  { icon:Users,  label:'Ocupacion',  val: sesion.reservas_count + '/' + sesion.capacidad_max + ' (' + occ + '%)' },
                  { icon:MapPin, label:'Espacio',    val: espNombre },
                  { icon:RefreshCw, label:'Instructora', val: instrNombre },
                ].map(({ icon:Icon, label, val }) => (
                  <div key={label} className="rounded-xl p-3" style={{ backgroundColor:'#F5F7F5' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} style={{ color:'#9CA3AF' }} />
                      <p className="label-caps" style={{ fontSize:9 }}>{label}</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color:'#1C2A22' }}>{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="label-caps">Ocupacion</p>
                  <p className="label-caps"
                    style={{ color: occ>=90 ? '#B34C60' : occ>=70 ? '#B07D1A' : '#9CA3AF' }}>
                    {occ}%
                  </p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor:'#F0F4F1' }}>
                  <div className="h-full rounded-full"
                    style={{ width: occ+'%',
                      backgroundColor: occ>=90 ? '#B34C60' : occ>=70 ? '#B07D1A' : '#4F7C44' }} />
                </div>
              </div>
              {sesion.es_recurrente && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ backgroundColor:'#EBF2E9', border:'1px solid #C5D9C0' }}>
                  <Repeat size={12} style={{ color:'#3E6335' }} />
                  <p className="text-xs" style={{ color:'#3E6335' }}>
                    Clase recurrente - editar afecta <strong>toda la serie</strong>
                  </p>
                </div>
              )}
              {!confirmarCancel ? (
                <button onClick={() => setConfirmarCancel(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ border:'1px solid #FECACA', color:'#991B1B', backgroundColor:'white' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='white'}>
                  <Trash2 size={13} /> Cancelar esta clase
                </button>
              ) : (
                <div className="rounded-xl p-4"
                  style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA' }}>
                  <p className="text-sm font-medium mb-3" style={{ color:'#991B1B' }}>
                    Confirmar cancelacion de esta clase?
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-ghost flex-1 justify-center text-xs"
                      onClick={() => setConfirmarCancel(false)}>No, volver</button>
                    <button onClick={cancelarSesion}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1.5"
                      style={{ backgroundColor:'#991B1B' }}>
                      <Trash2 size={11} /> Si, cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {modo === 'editar' && (
            <>
              {sesion.es_recurrente && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor:'#FFF7ED', border:'1px solid #FED7AA' }}>
                  <AlertTriangle size={13} style={{ color:'#9A3412', marginTop:1, flexShrink:0 }} />
                  <p className="text-xs" style={{ color:'#9A3412' }}>
                    Los cambios se aplicaran a <strong>toda la serie</strong>.
                  </p>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
                  <AlertTriangle size={13} /> {error}
                </div>
              )}
              <div>
                <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                  Instructora *
                </label>
                <select className="input" value={edit.instructora_id}
                  onChange={e => setEdit(f => ({ ...f, instructora_id:e.target.value }))}>
                  <option value="">Selecciona instructora</option>
                  {instructoras.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} {i.apellidos ?? ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                  Espacio *
                </label>
                <select className="input" value={edit.espacio_id}
                  onChange={e => setEdit(f => ({ ...f, espacio_id:e.target.value }))}>
                  <option value="">Selecciona espacio</option>
                  {espacios.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} (cap. {e.capacidad})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TimePicker label="Hora inicio" value={edit.hora_inicio}
                  onChange={val => setEdit(f => ({ ...f, hora_inicio:val }))} />
                <TimePicker label="Hora fin" value={edit.hora_fin}
                  onChange={val => setEdit(f => ({ ...f, hora_fin:val }))} />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                  Capacidad maxima
                </label>
                <input type="number" className="input" min="1" max="50" value={edit.capacidad_max}
                  onChange={e => setEdit(f => ({ ...f, capacidad_max:e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button className="btn-ghost flex-1 justify-center"
                  onClick={() => { setModo('ver'); setError('') }}>Cancelar</button>
                <button className="btn-primary flex-1 justify-center" onClick={guardar} disabled={saving}>
                  {saving
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Modal Crear clase --------------------------------------------------- */
function ModalCrear({ tiposClase, instructoras, espacios, onClose, onSaved }) {
  const [form, setForm]               = useState(FORM_INIT)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [horaFinAuto, setHoraFinAuto] = useState(false)

  // Tipo seleccionado
  const tipoSel = tiposClase.find(t => t.id === form.tipo_clase_id)

  // Instructoras que tienen esta disciplina en su catalogo
  const instructorasFiltradas = tipoSel
    ? instructoras.filter(i => Array.isArray(i.disciplinas) && i.disciplinas.includes(tipoSel.tipo))
    : []

  function handleTipoChange(tipo_id) {
    const tipo = tiposClase.find(t => t.id === tipo_id)
    const update = { tipo_clase_id: tipo_id, instructora_id: '' }
    if (tipo) {
      update.hora_fin = addMinutes(form.hora_inicio, tipo.duracion_min)
      setHoraFinAuto(true)
    }
    setForm(f => ({ ...f, ...update }))
  }

  function handleHoraInicioChange(val) {
    const tipo = tiposClase.find(t => t.id === form.tipo_clase_id)
    if (tipo) {
      setForm(f => ({ ...f, hora_inicio: val, hora_fin: addMinutes(val, tipo.duracion_min) }))
      setHoraFinAuto(true)
    } else {
      setForm(f => ({ ...f, hora_inicio: val }))
      setHoraFinAuto(false)
    }
  }

  function handleEspacioChange(esp_id) {
    const esp = espacios.find(e => e.id === esp_id)
    setForm(f => ({ ...f, espacio_id: esp_id,
      capacidad_max: esp ? String(esp.capacidad) : f.capacidad_max }))
  }

  function toggleDia(val) {
    setForm(f => ({
      ...f, dias_semana: f.dias_semana.includes(val)
        ? f.dias_semana.filter(d => d !== val)
        : [...f.dias_semana, val]
    }))
  }

  async function crearSesion() {
    setError('')
    if (!form.tipo_clase_id || !form.instructora_id || !form.espacio_id) {
      setError('Tipo de clase, instructora y espacio son obligatorios.'); return
    }
    setSaving(true)
    if (form.es_recurrente) {
      if (form.dias_semana.length === 0) {
        setError('Selecciona al menos un dia de la semana.'); setSaving(false); return
      }
      const { data: plantilla, error: errPl } = await supabase
        .from('plantillas_recurrentes')
        .insert({
          tipo_clase_id: form.tipo_clase_id, instructora_id: form.instructora_id,
          espacio_id: form.espacio_id,
          hora_inicio: form.hora_inicio+':00', hora_fin: form.hora_fin+':00',
          capacidad_max: parseInt(form.capacidad_max) || 10,
          dias_semana: form.dias_semana,
          fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null,
        }).select('id').single()
      if (errPl) { setError('Error al crear plantilla: '+errPl.message); setSaving(false); return }
      const fechas = generarFechas(form.fecha_inicio, form.fecha_fin, form.dias_semana)
      if (fechas.length === 0) { setError('Sin fechas validas en el rango.'); setSaving(false); return }
      for (let i = 0; i < fechas.length; i += 100) {
        const { error: errS } = await supabase.from('sesiones').insert(
          fechas.slice(i, i+100).map(fecha => ({
            tipo_clase_id: form.tipo_clase_id, instructora_id: form.instructora_id,
            espacio_id: form.espacio_id, fecha,
            hora_inicio: form.hora_inicio+':00', hora_fin: form.hora_fin+':00',
            capacidad_max: parseInt(form.capacidad_max) || 10,
            plantilla_id: plantilla.id, es_recurrente: true,
          }))
        )
        if (errS) { setError('Error al generar sesiones: '+errS.message); setSaving(false); return }
      }
    } else {
      const { error: err } = await supabase.from('sesiones').insert({
        tipo_clase_id: form.tipo_clase_id, instructora_id: form.instructora_id,
        espacio_id: form.espacio_id, fecha: form.fecha,
        hora_inicio: form.hora_inicio+':00', hora_fin: form.hora_fin+':00',
        capacidad_max: parseInt(form.capacidad_max) || 10, es_recurrente: false,
      })
      if (err) { setError('Error: '+err.message); setSaving(false); return }
    }
    setSaving(false); onSaved()
  }

  const diasLabel = DIAS_SEM.filter(d => form.dias_semana.includes(d.value)).map(d => d.full).join(', ')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl" style={{ color:'#111827' }}>Programar clase</h3>
          <button onClick={onClose} style={{ color:'#9CA3AF' }}
            className="hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-xs mb-4 flex items-center gap-2"
            style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <div className="space-y-4">

          {/* 1. Tipo de clase */}
          <div>
            <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
              Tipo de clase *
            </label>
            <select className="input" value={form.tipo_clase_id}
              onChange={e => handleTipoChange(e.target.value)}>
              <option value="">Selecciona una clase</option>
              {tiposClase.map(t => (
                <option key={t.id} value={t.id}>{t.nombre} · {t.duracion_min} min</option>
              ))}
            </select>
          </div>

          {/* 2. Instructora — filtrada por disciplina del tipo seleccionado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                Instructora / Instructor *
              </label>
              {tipoSel && (
                <span style={{ fontSize:11,
                  color: instructorasFiltradas.length === 0 ? '#B34C60' : '#4F7C44' }}>
                  {instructorasFiltradas.length === 0
                    ? 'Ninguna instructora disponible'
                    : instructorasFiltradas.length + ' disponible' + (instructorasFiltradas.length !== 1 ? 's' : '')}
                </span>
              )}
            </div>
            <select className="input" value={form.instructora_id}
              disabled={!tipoSel || instructorasFiltradas.length === 0}
              onChange={e => setForm(f => ({ ...f, instructora_id:e.target.value }))}
              style={{ opacity: (!tipoSel || instructorasFiltradas.length === 0) ? 0.55 : 1 }}>
              <option value="">
                {!tipoSel
                  ? 'Primero selecciona el tipo de clase'
                  : instructorasFiltradas.length === 0
                    ? 'Ninguna instructora imparte esta disciplina'
                    : 'Selecciona instructora'}
              </option>
              {instructorasFiltradas.map(i => (
                <option key={i.id} value={i.id}>{i.nombre} {i.apellidos ?? ''}</option>
              ))}
            </select>
            {tipoSel && instructorasFiltradas.length === 0 && (
              <p className="mt-1.5 text-xs flex items-center gap-1.5"
                style={{ color:'#B07D1A' }}>
                <AlertTriangle size={11} />
                Agrega la disciplina <strong>{tipoSel.nombre}</strong> al perfil de una instructora primero.
              </p>
            )}
          </div>

          {/* 3. Espacio */}
          <div>
            <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
              Espacio *
            </label>
            <select className="input" value={form.espacio_id}
              onChange={e => handleEspacioChange(e.target.value)}>
              <option value="">Selecciona espacio</option>
              {espacios.map(e => (
                <option key={e.id} value={e.id}>{e.nombre} (cap. {e.capacidad})</option>
              ))}
            </select>
          </div>

          {/* 4. TimePicker mejorado */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <TimePicker
                label="Hora inicio"
                value={form.hora_inicio}
                onChange={handleHoraInicioChange}
              />
              <TimePicker
                label="Hora fin"
                value={form.hora_fin}
                propuesto={horaFinAuto}
                onChange={val => {
                  setForm(f => ({ ...f, hora_fin:val }))
                  setHoraFinAuto(false)
                }}
              />
            </div>
            {tipoSel && (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex-1 h-px" style={{ backgroundColor:'#E2E8E2' }} />
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{ backgroundColor:'#EBF2E9', color:'#3E6335', whiteSpace:'nowrap' }}>
                  <Clock size={9} />
                  {tipoSel.duracion_min} min &nbsp;|&nbsp; {form.hora_inicio} - {form.hora_fin}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor:'#E2E8E2' }} />
              </div>
            )}
          </div>

          {/* 5. Capacidad */}
          <div>
            <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
              Capacidad maxima
            </label>
            <input type="number" className="input" min="1" max="50" value={form.capacidad_max}
              placeholder="Se toma del espacio"
              onChange={e => setForm(f => ({ ...f, capacidad_max:e.target.value }))} />
          </div>

          {/* 6. Toggle recurrencia */}
          <div className="rounded-xl p-4"
            style={{ backgroundColor:'#F5F7F5', border:'1px solid #E2E8E2' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm(f => ({ ...f, es_recurrente:!f.es_recurrente }))}
                className="w-10 h-6 rounded-full relative transition-colors"
                style={{ backgroundColor: form.es_recurrente ? '#3E6335' : '#D1D5DB' }}>
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: form.es_recurrente ? '18px' : '2px' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color:'#1C2A22' }}>
                  <Repeat size={13} className="inline mr-1.5"
                    style={{ color: form.es_recurrente ? '#3E6335' : '#9CA3AF' }} />
                  Clase recurrente
                </p>
                <p style={{ fontSize:11, color:'#9CA3AF' }}>
                  Se programa en los dias seleccionados
                </p>
              </div>
            </label>
          </div>

          {/* 7. Recurrencia o fecha unica */}
          {form.es_recurrente ? (
            <>
              <div>
                <label className="block mb-2" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                  Dias de la semana *
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
                  <p className="mt-1.5" style={{ fontSize:11, color:'#4F7C44' }}>{diasLabel}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                    Fecha inicio *
                  </label>
                  <input type="date" className="input" value={form.fecha_inicio}
                    onChange={e => setForm(f => ({ ...f, fecha_inicio:e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                    Fecha fin (opcional)
                  </label>
                  <input type="date" className="input" value={form.fecha_fin}
                    min={form.fecha_inicio}
                    onChange={e => setForm(f => ({ ...f, fecha_fin:e.target.value }))} />
                </div>
              </div>
              {form.dias_semana.length > 0 && form.fecha_inicio && (
                <div className="rounded-lg px-3 py-2.5 text-xs"
                  style={{ backgroundColor:'#EBF2E9', border:'1px solid #C5D9C0' }}>
                  <p className="font-medium mb-0.5" style={{ color:'#3E6335' }}>Vista previa</p>
                  <p style={{ color:'#4B5563' }}>
                    {generarFechas(form.fecha_inicio, form.fecha_fin, form.dias_semana).length} sesiones
                    {form.fecha_fin
                      ? ' hasta el ' + format(parseISO(form.fecha_fin), "d 'de' MMMM yyyy", { locale:es })
                      : ' (8 semanas por defecto)'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
                Fecha *
              </label>
              <input type="date" className="input" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha:e.target.value }))} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Cancelar</button>
            <button className="btn-primary flex-1 justify-center"
              onClick={crearSesion} disabled={saving}>
              {saving
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : form.es_recurrente ? <><Repeat size={13} /> Crear serie</> : 'Crear clase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Agenda principal ---------------------------------------------------- */
export default function Agenda() {
  const [semana, setSemana]       = useState(startOfWeek(new Date(), { weekStartsOn:1 }))
  const [sesiones, setSesiones]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCrear, setShowCrear] = useState(false)
  const [sesionSel, setSesionSel] = useState(null)

  const [tiposClase,   setTiposClase]   = useState([])
  const [instructoras, setInstructoras] = useState([])
  const [espacios,     setEspacios]     = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('tipos_clase')
        .select('id,nombre,color_hex,duracion_min,tipo').eq('activo',true).order('nombre'),
      supabase.from('instructoras')
        .select('id,nombre,apellidos,color_hex,disciplinas').eq('activa',true).order('nombre'),
      supabase.from('espacios')
        .select('id,nombre,capacidad').eq('activo',true).order('nombre'),
    ]).then(([tc,inst,esp]) => {
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
    const { data } = await supabase.from('sesiones')
      .select('id,fecha,hora_inicio,hora_fin,capacidad_max,reservas_count,cancelada,plantilla_id,es_recurrente,instructora_id,espacio_id,tipo_clase_id,tipos_clase(nombre,color_hex),instructoras(nombre)')
      .gte('fecha', desde).lte('fecha', hasta)
      .eq('cancelada', false).order('hora_inicio')
    setSesiones(data ?? [])
    setLoading(false)
  }

  function getSesionesForSlot(dia, hora) {
    return sesiones.filter(s =>
      isSameDay(new Date(s.fecha+'T00:00:00'), dia) &&
      s.hora_inicio?.startsWith(hora.slice(0,5))
    )
  }

  const dias = Array.from({ length:7 }, (_, i) => addDays(semana, i))

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Vista semanal de clases"
        actions={
          <button className="btn-primary" onClick={() => setShowCrear(true)}>
            <Plus size={15} /> Programar clase
          </button>
        }
      />

      <div className="flex items-center gap-3">
        <button onClick={() => setSemana(s => subWeeks(s,1))} className="btn-ghost px-2.5">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium min-w-[240px] text-center" style={{ color:'#1C2A22' }}>
          {format(semana, "d 'de' MMMM", { locale:es })} &mdash; {format(addDays(semana,6), "d 'de' MMMM yyyy", { locale:es })}
        </p>
        <button onClick={() => setSemana(s => addWeeks(s,1))} className="btn-ghost px-2.5">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setSemana(startOfWeek(new Date(), { weekStartsOn:1 }))}
          className="text-xs hover:underline" style={{ color:'#4F7C44' }}>
          Hoy
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor:'#3E6335', borderTopColor:'transparent' }} />
        </div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr style={{ borderBottom:'1px solid #E2E8E2' }}>
                <th className="w-16 py-3 px-3 text-left font-medium" style={{ color:'#9CA3AF' }}>Hora</th>
                {dias.map(dia => (
                  <th key={String(dia)} className="py-3 px-2 font-medium text-center"
                    style={{ color: isSameDay(dia,new Date()) ? '#3E6335' : '#1C2A22' }}>
                    <p className="uppercase tracking-wide" style={{ fontSize:10 }}>
                      {format(dia,'EEE',{ locale:es })}
                    </p>
                    <p className="font-display mt-0.5 text-lg"
                      style={isSameDay(dia,new Date()) ? {
                        backgroundColor:'#3E6335', color:'white', width:28, height:28,
                        borderRadius:'50%', display:'flex', alignItems:'center',
                        justifyContent:'center', margin:'2px auto 0'
                      } : {}}>
                      {format(dia,'d')}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map(hora => (
                <tr key={hora} style={{ borderBottom:'1px solid #F0F4F1', height:80 }}>
                  <td className="px-3 py-2 align-top pt-2" style={{ color:'#9CA3AF' }}>{hora}</td>
                  {dias.map(dia => {
                    const slots = getSesionesForSlot(dia, hora)
                    return (
                      <td key={String(dia)} className="px-1 py-1 align-top">
                        {slots.map(s => {
                          const occ   = s.capacidad_max > 0
                            ? Math.round((s.reservas_count/s.capacidad_max)*100) : 0
                          const color = s.tipos_clase?.color_hex ?? '#3E6335'
                          return (
                            <div key={s.id}
                              className="rounded-lg p-1.5 mb-1 cursor-pointer transition-all group"
                              style={{ backgroundColor:color+'18', borderLeft:'3px solid '+color }}
                              onClick={() => setSesionSel(s)}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = color+'28'
                                e.currentTarget.style.transform = 'scale(1.01)'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = color+'18'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}>
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-semibold leading-tight flex-1 truncate"
                                  style={{ color:'#1C2A22' }}>
                                  {s.tipos_clase?.nombre}
                                </p>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {s.es_recurrente && <RefreshCw size={8} style={{ color:'#9CA3AF' }} />}
                                  <Edit size={9} style={{ color:'#9CA3AF' }} />
                                </div>
                              </div>
                              <p className="mt-0.5 truncate" style={{ color:'#9CA3AF' }}>
                                {s.instructoras?.nombre}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users size={9} style={{ color:'#9CA3AF' }} />
                                <span style={{ color: occ>=90 ? '#B34C60' : occ>=70 ? '#B07D1A' : '#9CA3AF' }}>
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

      {showCrear && (
        <ModalCrear
          tiposClase={tiposClase} instructoras={instructoras} espacios={espacios}
          onClose={() => setShowCrear(false)}
          onSaved={() => { setShowCrear(false); loadSesiones() }}
        />
      )}

      {sesionSel && (
        <ModalEvento
          sesion={sesionSel} instructoras={instructoras} espacios={espacios}
          onClose={() => setSesionSel(null)}
          onSaved={() => { setSesionSel(null); loadSesiones() }}
          onCancelSesion={() => { setSesionSel(null); loadSesiones() }}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { Plus, Star, Users, DollarSign, Edit, X, Trash2, AlertTriangle } from 'lucide-react'

const DISCIPLINAS_OPTS = [
  { value: 'pilates_reformer',  label: 'Pilates Reformer' },
  { value: 'pilates_mat',       label: 'Pilates Mat' },
  { value: 'yoga_flow',         label: 'Yoga Flow' },
  { value: 'yoga_restaurativo', label: 'Yoga Restaurativo' },
  { value: 'barre',             label: 'Barre' },
  { value: 'meditacion',        label: 'Meditación' },
  { value: 'stretching',        label: 'Stretching' },
  { value: 'trx',               label: 'TRX' },
]

const COLORES = ['#3E6335','#5E8A6E','#B34C60','#7B6CAA','#B07D1A','#4A90A4','#2C3E2D','#C4896A']

const FORM_INIT = {
  nombre: '', apellidos: '', email: '', telefono: '',
  fee_por_clase: '300', meta_clases_mes: '16',
  disciplinas: [], color_hex: '#3E6335',
}

function InstructoraForm({ form, setForm, onSave, onCancel, saving, error, title }) {
  function toggleDisciplina(val) {
    setForm(f => ({
      ...f,
      disciplinas: f.disciplinas.includes(val)
        ? f.disciplinas.filter(d => d !== val)
        : [...f.disciplinas, val]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl" style={{ color: '#111827' }}>{title}</h3>
          <button onClick={onCancel} style={{ color: '#9CA3AF' }} className="hover:text-gray-600 transition-colors">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>Nombre *</label>
              <input className="input" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>Apellidos</label>
              <input className="input" value={form.apellidos}
                onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>Teléfono *</label>
              <input className="input" value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>Fee por clase ($)</label>
              <input className="input" type="number" value={form.fee_por_clase}
                onChange={e => setForm(f => ({ ...f, fee_por_clase: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>Meta clases/mes</label>
              <input className="input" type="number" value={form.meta_clases_mes}
                onChange={e => setForm(f => ({ ...f, meta_clases_mes: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
              Disciplinas * (selecciona las que imparte)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DISCIPLINAS_OPTS.map(d => {
                const sel = form.disciplinas.includes(d.value)
                return (
                  <label key={d.value}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs"
                    style={{
                      borderColor: sel ? '#3E6335' : '#E2E8E2',
                      backgroundColor: sel ? '#EBF2E9' : 'white',
                      color: sel ? '#1C2A22' : '#9CA3AF',
                    }}>
                    <input type="checkbox" className="hidden"
                      checked={sel} onChange={() => toggleDisciplina(d.value)} />
                    <span className="w-3 h-3 rounded flex items-center justify-center shrink-0 transition-all"
                      style={{
                        backgroundColor: sel ? '#3E6335' : 'white',
                        border: `1.5px solid ${sel ? '#3E6335' : '#D1D5DB'}`,
                      }}>
                      {sel && <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>✓</span>}
                    </span>
                    {d.label}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>
              Color de identificación
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORES.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color_hex: c }))}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    backgroundColor: c,
                    outline: form.color_hex === c ? `2.5px solid #111827` : 'none',
                    outlineOffset: 2,
                    transform: form.color_hex === c ? 'scale(1.15)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1 justify-center" onClick={onCancel}>Cancelar</button>
            <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}>
              {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmarEliminar({ instructora, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
          style={{ backgroundColor: '#FEE2E2' }}>
          <Trash2 size={20} style={{ color: '#991B1B' }} />
        </div>
        <h3 className="font-display text-xl text-center mb-2" style={{ color: '#111827' }}>
          ¿Eliminar instructora?
        </h3>
        <p className="text-sm text-center mb-1" style={{ color: '#4B5563' }}>
          Estás por eliminar a <strong>{instructora.nombre} {instructora.apellidos}</strong>.
        </p>
        <p className="text-xs text-center mb-6" style={{ color: '#9CA3AF' }}>
          Esta acción no se puede deshacer. Sus clases pasadas no serán afectadas.
        </p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onCancel}>Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: '#991B1B' }}>
            {deleting
              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Eliminando…</>
              : <><Trash2 size={13} /> Sí, eliminar</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Instructoras() {
  const [instructoras, setInstructoras] = useState([])
  const [loading, setLoading]           = useState(true)

  // Modales
  const [showCreate, setShowCreate]     = useState(false)
  const [editTarget, setEditTarget]     = useState(null)   // instructora a editar
  const [deleteTarget, setDeleteTarget] = useState(null)   // instructora a eliminar

  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm]       = useState(FORM_INIT)
  const [error, setError]     = useState('')

  function loadInstructoras() {
    setLoading(true)
    supabase.from('instructoras')
      .select('*')
      .eq('activa', true)
      .order('nombre')
      .then(({ data }) => { setInstructoras(data ?? []); setLoading(false) })
  }

  useEffect(() => { loadInstructoras() }, [])

  // ── Abrir modal edición ───────────────────────────
  function openEdit(inst) {
    setError('')
    setForm({
      nombre:          inst.nombre ?? '',
      apellidos:       inst.apellidos ?? '',
      email:           inst.email ?? '',
      telefono:        inst.telefono ?? '',
      fee_por_clase:   String(inst.fee_por_clase ?? 300),
      meta_clases_mes: String(inst.meta_clases_mes ?? 16),
      disciplinas:     inst.disciplinas ?? [],
      color_hex:       inst.color_hex ?? '#3E6335',
    })
    setEditTarget(inst)
  }

  // ── Crear ─────────────────────────────────────────
  async function crearInstructora() {
    setError('')
    if (!form.nombre || !form.telefono || form.disciplinas.length === 0) {
      setError('Nombre, teléfono y al menos una disciplina son obligatorios.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('instructoras').insert({
      nombre:          form.nombre,
      apellidos:       form.apellidos || null,
      email:           form.email || null,
      telefono:        form.telefono,
      fee_por_clase:   parseFloat(form.fee_por_clase) || 300,
      meta_clases_mes: parseInt(form.meta_clases_mes) || 16,
      disciplinas:     form.disciplinas,
      color_hex:       form.color_hex,
      activa:          true,
      disponible_hoy:  true,
    })
    setSaving(false)
    if (err) { setError('Error: ' + err.message); return }
    setShowCreate(false)
    setForm(FORM_INIT)
    loadInstructoras()
  }

  // ── Actualizar ────────────────────────────────────
  async function actualizarInstructora() {
    setError('')
    if (!form.nombre || !form.telefono || form.disciplinas.length === 0) {
      setError('Nombre, teléfono y al menos una disciplina son obligatorios.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase
      .from('instructoras')
      .update({
        nombre:          form.nombre,
        apellidos:       form.apellidos || null,
        email:           form.email || null,
        telefono:        form.telefono,
        fee_por_clase:   parseFloat(form.fee_por_clase) || 300,
        meta_clases_mes: parseInt(form.meta_clases_mes) || 16,
        disciplinas:     form.disciplinas,
        color_hex:       form.color_hex,
      })
      .eq('id', editTarget.id)
    setSaving(false)
    if (err) { setError('Error: ' + err.message); return }
    setEditTarget(null)
    setForm(FORM_INIT)
    loadInstructoras()
  }

  // ── Eliminar (soft delete) ────────────────────────
  async function eliminarInstructora() {
    setDeleting(true)
    const { error: err } = await supabase
      .from('instructoras')
      .update({ activa: false })
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (err) { console.error(err); return }
    setDeleteTarget(null)
    loadInstructoras()
  }

  const totalNomina = instructoras.reduce((s, i) => s + (i.fee_por_clase * (i.meta_clases_mes ?? 0)), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Instructoras"
        subtitle="Equipo · Disponibilidad · Tarifas"
        actions={
          <button className="btn-primary" onClick={() => { setForm(FORM_INIT); setError(''); setShowCreate(true) }}>
            <Plus size={15} /> Agregar instructora
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total activas"   value={instructoras.length}                           icon={Users} />
        <KPICard title="Nómina estimada" value={"$" + totalNomina.toLocaleString('es-MX')}     icon={DollarSign} />
        <KPICard title="Rating promedio" value={instructoras.length
          ? (instructoras.reduce((s,i) => s+(i.rating_promedio ?? 5),0)/instructoras.length).toFixed(1)
          : '—'} icon={Star} />
        <KPICard title="Disponibles hoy" value={instructoras.filter(i => i.disponible_hoy).length} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#3E6335', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instructoras.length === 0 ? (
            <div className="col-span-3 card p-12 text-center" style={{ color: '#9CA3AF' }}>
              <p className="mb-4">Sin instructoras registradas</p>
              <button className="btn-primary mx-auto"
                onClick={() => { setForm(FORM_INIT); setError(''); setShowCreate(true) }}>
                <Plus size={14} /> Agregar primera instructora
              </button>
            </div>
          ) : instructoras.map(inst => (
            <div key={inst.id} className="card-hover overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: inst.color_hex ?? '#3E6335' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                      style={{ backgroundColor: inst.color_hex ?? '#3E6335' }}>
                      {inst.nombre?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#1C2A22' }}>
                        {inst.nombre} {inst.apellidos}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} fill="#B07D1A" stroke="none" />
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          {inst.rating_promedio ?? '5.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={"badge " + (inst.disponible_hoy ? 'badge-green' : 'badge-gray')}>
                    {inst.disponible_hoy ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {(inst.disciplinas ?? []).map(d => (
                    <span key={d} className="badge badge-gold text-[10px]">
                      {d.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  {[
                    { val: inst.clases_impartidas ?? 0, label: 'Clases' },
                    { val: '$' + inst.fee_por_clase,    label: 'Fee/clase' },
                    { val: inst.meta_clases_mes,        label: 'Meta/mes' },
                  ].map(({ val, label }) => (
                    <div key={label} className="rounded-lg p-2" style={{ backgroundColor: '#F0F4F1' }}>
                      <p className="font-display text-lg" style={{ color: '#111827' }}>{val}</p>
                      <p style={{ fontSize: 10, color: '#9CA3AF' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Botones editar / eliminar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(inst)}
                    className="btn-ghost flex-1 justify-center text-xs">
                    <Edit size={12} /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteTarget(inst)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ border: '1px solid #FECACA', color: '#991B1B', backgroundColor: 'white' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear */}
      {showCreate && (
        <InstructoraForm
          title="Nueva instructora"
          form={form} setForm={setForm}
          onSave={crearInstructora}
          onCancel={() => { setShowCreate(false); setError('') }}
          saving={saving} error={error}
        />
      )}

      {/* Modal Editar */}
      {editTarget && (
        <InstructoraForm
          title={`Editar — ${editTarget.nombre}`}
          form={form} setForm={setForm}
          onSave={actualizarInstructora}
          onCancel={() => { setEditTarget(null); setError('') }}
          saving={saving} error={error}
        />
      )}

      {/* Modal Confirmar Eliminar */}
      {deleteTarget && (
        <ConfirmarEliminar
          instructora={deleteTarget}
          onConfirm={eliminarInstructora}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}

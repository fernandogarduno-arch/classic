import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { Plus, Star, Users, DollarSign, Edit, X } from 'lucide-react'

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

const COLORES = ['#B5703A','#5E8A6E','#C25C6E','#7B6CAA','#C49A2A','#4A90A4','#2C3E2D','#C4896A']

const FORM_INIT = {
  nombre: '', apellidos: '', email: '', telefono: '',
  fee_por_clase: '300', meta_clases_mes: '16',
  disciplinas: [], color_hex: '#B5703A',
}

export default function Instructoras() {
  const [instructoras, setInstructoras] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [form, setForm]                 = useState(FORM_INIT)
  const [error, setError]               = useState('')

  function loadInstructoras() {
    setLoading(true)
    supabase.from('instructoras')
      .select('*')
      .eq('activa', true)
      .order('nombre')
      .then(({ data }) => { setInstructoras(data ?? []); setLoading(false) })
  }

  useEffect(() => { loadInstructoras() }, [])

  function toggleDisciplina(val) {
    setForm(f => ({
      ...f,
      disciplinas: f.disciplinas.includes(val)
        ? f.disciplinas.filter(d => d !== val)
        : [...f.disciplinas, val]
    }))
  }

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
    setShowModal(false)
    setForm(FORM_INIT)
    loadInstructoras()
  }

  const totalNomina = instructoras.reduce((s, i) => s + (i.fee_por_clase * (i.meta_clases_mes ?? 0)), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Instructoras"
        subtitle="Equipo · Disponibilidad · Tarifas"
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Agregar instructora
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total activas"   value={instructoras.length} icon={Users} />
        <KPICard title="Nómina estimada" value={"$" + totalNomina.toLocaleString('es-MX')} icon={DollarSign} />
        <KPICard title="Rating promedio" value={instructoras.length ? (instructoras.reduce((s,i) => s+(i.rating_promedio ?? 5),0)/instructoras.length).toFixed(1) : '—'} icon={Star} />
        <KPICard title="Disponibles hoy" value={instructoras.filter(i => i.disponible_hoy).length} icon={Users} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instructoras.length === 0 ? (
            <div className="col-span-3 card p-12 text-center text-cs-muted">
              <p className="mb-4">Sin instructoras registradas</p>
              <button className="btn-primary mx-auto" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Agregar primera instructora
              </button>
            </div>
          ) : instructoras.map(inst => (
            <div key={inst.id} className="card overflow-hidden">
              <div className="h-2" style={{ backgroundColor: inst.color_hex ?? '#B5703A' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ backgroundColor: inst.color_hex ?? '#B5703A' }}>
                      {inst.nombre?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-cs-charcoal">{inst.nombre} {inst.apellidos}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={11} fill="#4F7C44" stroke="none" />
                        <span className="text-xs text-cs-muted">{inst.rating_promedio ?? '5.0'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={"badge " + (inst.disponible_hoy ? 'badge-green' : 'badge-gray')}>
                    {inst.disponible_hoy ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {(inst.disciplinas ?? []).map(d => (
                    <span key={d} className="badge badge-gold text-[10px]">{d.replace(/_/g,' ')}</span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-cs-cream rounded-lg p-2">
                    <p className="font-display text-lg text-cs-charcoal">{inst.clases_impartidas ?? 0}</p>
                    <p className="text-[10px] text-cs-muted">Clases tot.</p>
                  </div>
                  <div className="bg-cs-cream rounded-lg p-2">
                    <p className="font-display text-lg text-cs-charcoal">${inst.fee_por_clase}</p>
                    <p className="text-[10px] text-cs-muted">Fee/clase</p>
                  </div>
                  <div className="bg-cs-cream rounded-lg p-2">
                    <p className="font-display text-lg text-cs-charcoal">{inst.meta_clases_mes}</p>
                    <p className="text-[10px] text-cs-muted">Meta/mes</p>
                  </div>
                </div>

                <button className="btn-ghost w-full justify-center text-xs">
                  <Edit size={12} /> Editar perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl text-cs-charcoal">Nueva instructora</h3>
              <button onClick={() => { setShowModal(false); setError('') }} className="text-cs-muted hover:text-cs-charcoal">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-4">{error}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Nombre *</label>
                  <input className="input" value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Apellidos</label>
                  <input className="input" value={form.apellidos}
                    onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Teléfono *</label>
                  <input className="input" value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Email</label>
                  <input className="input" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Fee por clase ($)</label>
                  <input className="input" type="number" value={form.fee_por_clase}
                    onChange={e => setForm(f => ({ ...f, fee_por_clase: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Meta clases/mes</label>
                  <input className="input" type="number" value={form.meta_clases_mes}
                    onChange={e => setForm(f => ({ ...f, meta_clases_mes: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-2">Disciplinas * (selecciona las que imparte)</label>
                <div className="grid grid-cols-2 gap-2">
                  {DISCIPLINAS_OPTS.map(d => {
                    const sel = form.disciplinas.includes(d.value)
                    return (
                      <label key={d.value}
                        className={"flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs " +
                          (sel ? 'border-cs-olive bg-cs-olive-bg text-cs-charcoal' : 'border-cs-border text-cs-muted hover:border-cs-olive')}>
                        <input type="checkbox" className="hidden"
                          checked={sel} onChange={() => toggleDisciplina(d.value)} />
                        <span className={"w-3 h-3 rounded border flex items-center justify-center shrink-0 " +
                          (sel ? 'bg-cs-olive border-cs-olive' : 'border-gray-300')}>
                          {sel && <span className="text-white text-[8px] font-bold">✓</span>}
                        </span>
                        {d.label}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-2">Color de identificación</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color_hex: c }))}
                      className={"w-8 h-8 rounded-full border-2 transition-all " +
                        (form.color_hex === c ? 'border-cs-ink scale-110' : 'border-transparent')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="btn-ghost flex-1" onClick={() => { setShowModal(false); setError('') }}>Cancelar</button>
                <button className="btn-primary flex-1 justify-center" onClick={crearInstructora} disabled={saving}>
                  {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Guardando…' : 'Crear instructora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

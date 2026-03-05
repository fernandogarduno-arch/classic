import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import {
  Search, Plus, MessageCircle, Phone,
  Edit, Trash2, X, AlertTriangle, ChevronDown
} from 'lucide-react'

const ETAPAS_LEAD  = ['nuevo','contactado','interesado','prueba_gratis','convertido','perdido']
const ETAPA_LABEL  = { nuevo:'Nuevo', contactado:'Contactado', interesado:'Interesado',
                       prueba_gratis:'Prueba gratis', convertido:'Convertido', perdido:'Perdido' }
const RIESGO_BADGE = { bajo:'badge-green', medio:'badge-yellow',
                       alto:'bg-orange-100 text-orange-700 badge', critico:'badge-red' }
const STATUS_BADGE = { activo:'badge-green', inactivo:'badge-gray',
                       suspendido:'badge-yellow', cancelado:'badge-red', prueba:'badge-blue' }
const STATUS_OPTS  = ['activo','inactivo','suspendido','cancelado','prueba']
const RIESGO_OPTS  = ['bajo','medio','alto','critico']

const FORM_INIT = { nombre:'', apellidos:'', email:'', telefono:'',
                    status:'activo', riesgo_churn:'bajo', plan_id:'' }

/* ── Shared label ──────────────────────────────────── */
const Lbl = ({ children }) => (
  <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
    {children}
  </label>
)

/* ── Modal formulario cliente ─────────────────────── */
function ClienteModal({ title, form, setForm, planes, onSave, onCancel, saving, error }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl" style={{ color:'#111827' }}>{title}</h3>
          <button onClick={onCancel} style={{ color:'#9CA3AF' }} className="hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 text-xs mb-4 flex items-center gap-2"
            style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Lbl>Nombre *</Lbl>
              <input className="input" value={form.nombre}
                onChange={e => setForm(f => ({...f, nombre:e.target.value}))} />
            </div>
            <div>
              <Lbl>Apellidos</Lbl>
              <input className="input" value={form.apellidos}
                onChange={e => setForm(f => ({...f, apellidos:e.target.value}))} />
            </div>
          </div>
          <div>
            <Lbl>Email</Lbl>
            <input className="input" type="email" value={form.email}
              onChange={e => setForm(f => ({...f, email:e.target.value}))} />
          </div>
          <div>
            <Lbl>Teléfono / WhatsApp *</Lbl>
            <input className="input" value={form.telefono}
              onChange={e => setForm(f => ({...f, telefono:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Lbl>Status</Lbl>
              <select className="input" value={form.status}
                onChange={e => setForm(f => ({...f, status:e.target.value}))}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Lbl>Riesgo churn</Lbl>
              <select className="input" value={form.riesgo_churn}
                onChange={e => setForm(f => ({...f, riesgo_churn:e.target.value}))}>
                {RIESGO_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Lbl>Plan</Lbl>
            <select className="input" value={form.plan_id}
              onChange={e => setForm(f => ({...f, plan_id:e.target.value}))}>
              <option value="">Sin plan por ahora</option>
              {planes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — ${p.precio_mensual}/mes</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1 justify-center" onClick={onCancel}>Cancelar</button>
            <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}>
              {saving
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando…</>
                : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Modal confirmar eliminar ─────────────────────── */
function ConfirmarEliminar({ cliente, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor:'#FEE2E2' }}>
          <Trash2 size={20} style={{ color:'#991B1B' }} />
        </div>
        <h3 className="font-display text-xl text-center mb-2" style={{ color:'#111827' }}>
          ¿Eliminar cliente?
        </h3>
        <p className="text-sm text-center mb-1" style={{ color:'#4B5563' }}>
          Estás por eliminar a <strong>{cliente.nombre} {cliente.apellidos}</strong>.
        </p>
        <p className="text-xs text-center mb-6" style={{ color:'#9CA3AF' }}>
          Sus reservas y pagos históricos no serán afectados.
        </p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 justify-center" onClick={onCancel}>Cancelar</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ backgroundColor:'#991B1B' }}>
            {deleting
              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Eliminando…</>
              : <><Trash2 size={13} /> Sí, eliminar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
export default function Clientes() {
  const [tab, setTab]         = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [leads, setLeads]     = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [planes, setPlanes]   = useState([])

  // Modales
  const [showCreate, setShowCreate]     = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [form, setForm]     = useState(FORM_INIT)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    if (tab === 'clientes' || tab === 'riesgo') {
      let q = supabase.from('clientes')
        .select('id,nombre,apellidos,email,telefono,status,riesgo_churn,dias_sin_visita,visitas_semana_prom,total_clases')
        .order('dias_sin_visita', { ascending: false })
      if (tab === 'riesgo') q = q.in('riesgo_churn', ['alto','critico'])
      const { data } = await q
      setClientes(data ?? [])
    } else {
      const { data } = await supabase.from('leads').select('*').order('score', { ascending: false })
      setLeads(data ?? [])
    }
    const { data: p } = await supabase.from('planes').select('id,nombre,precio_mensual').eq('activo', true)
    setPlanes(p ?? [])
    setLoading(false)
  }

  function openEdit(c) {
    setError('')
    setForm({
      nombre:       c.nombre ?? '',
      apellidos:    c.apellidos ?? '',
      email:        c.email ?? '',
      telefono:     c.telefono ?? '',
      status:       c.status ?? 'activo',
      riesgo_churn: c.riesgo_churn ?? 'bajo',
      plan_id:      '',
    })
    setEditTarget(c)
  }

  async function crearCliente() {
    setError('')
    if (!form.nombre || !form.telefono) { setError('Nombre y teléfono son obligatorios.'); return }
    setSaving(true)
    const { error: err } = await supabase.from('clientes').insert({
      nombre: form.nombre, apellidos: form.apellidos || null,
      email: form.email || null, telefono: form.telefono,
      status: form.status, riesgo_churn: form.riesgo_churn,
    })
    setSaving(false)
    if (err) { setError('Error: ' + err.message); return }
    setShowCreate(false); setForm(FORM_INIT); loadData()
  }

  async function actualizarCliente() {
    setError('')
    if (!form.nombre || !form.telefono) { setError('Nombre y teléfono son obligatorios.'); return }
    setSaving(true)
    const { error: err } = await supabase.from('clientes').update({
      nombre: form.nombre, apellidos: form.apellidos || null,
      email: form.email || null, telefono: form.telefono,
      status: form.status, riesgo_churn: form.riesgo_churn,
    }).eq('id', editTarget.id)
    setSaving(false)
    if (err) { setError('Error: ' + err.message); return }
    setEditTarget(null); setForm(FORM_INIT); loadData()
  }

  async function eliminarCliente() {
    setDeleting(true)
    await supabase.from('clientes').update({ status: 'cancelado' }).eq('id', deleteTarget.id)
    setDeleting(false); setDeleteTarget(null); loadData()
  }

  const filteredClientes = clientes.filter(c =>
    `${c.nombre} ${c.apellidos} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )
  const filteredLeads = leads.filter(l =>
    `${l.nombre} ${l.apellidos} ${l.telefono}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="CRM · Leads · Retención"
        actions={
          <button className="btn-primary"
            onClick={() => { setForm(FORM_INIT); setError(''); setShowCreate(true) }}>
            <Plus size={15} /> Nuevo cliente
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor:'white', border:'1px solid #E2E8E2' }}>
        {[
          { key:'clientes', label:'Clientes' },
          { key:'leads',    label:'Pipeline' },
          { key:'riesgo',   label:'En Riesgo' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.key ? '#1C2A22' : 'transparent',
              color: tab === t.key ? 'white' : '#9CA3AF',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#9CA3AF' }} />
        <input className="input pl-8" placeholder="Buscar por nombre, email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor:'#3E6335', borderTopColor:'transparent' }} />
        </div>
      ) : (tab === 'clientes' || tab === 'riesgo') ? (

        /* ── TABLA CLIENTES ─────────────────────────────────── */
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom:'1px solid #E2E8E2', backgroundColor:'#F5F7F5' }}>
                {['Cliente','Status','Riesgo','Sin visita','Vis/sem','Clases','Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 label-caps">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color:'#9CA3AF' }}>
                  Sin resultados
                </td></tr>
              ) : filteredClientes.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor:'#4F7C44' }}>
                        {c.nombre?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color:'#1C2A22' }}>{c.nombre} {c.apellidos}</p>
                        <p className="text-xs" style={{ color:'#9CA3AF' }}>{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[c.status] ?? 'badge-gray'}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={RIESGO_BADGE[c.riesgo_churn] ?? 'badge-gray'}>{c.riesgo_churn}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: c.dias_sin_visita >= 14 ? '#B34C60' : '#1C2A22',
                      fontWeight: c.dias_sin_visita >= 14 ? 600 : 400 }}>
                      {c.dias_sin_visita === 999 ? '—' : `${c.dias_sin_visita}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color:'#1C2A22' }}>{c.visitas_semana_prom ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color:'#1C2A22' }}>{c.total_clases}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="WhatsApp" onClick={() => window.open(`https://wa.me/${c.telefono}`)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color:'#9CA3AF' }}
                        onMouseEnter={e => e.currentTarget.style.color='#166534'}
                        onMouseLeave={e => e.currentTarget.style.color='#9CA3AF'}>
                        <MessageCircle size={14} />
                      </button>
                      <button title="Editar" onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color:'#9CA3AF' }}
                        onMouseEnter={e => e.currentTarget.style.color='#1C2A22'}
                        onMouseLeave={e => e.currentTarget.style.color='#9CA3AF'}>
                        <Edit size={14} />
                      </button>
                      <button title="Eliminar" onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color:'#9CA3AF' }}
                        onMouseEnter={e => e.currentTarget.style.color='#991B1B'}
                        onMouseLeave={e => e.currentTarget.style.color='#9CA3AF'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        /* ── KANBAN LEADS ───────────────────────────────────── */
        <div className="flex gap-4 overflow-x-auto pb-2">
          {ETAPAS_LEAD.filter(e => e !== 'perdido').map(etapa => {
            const etapaLeads = filteredLeads.filter(l => l.etapa === etapa)
            return (
              <div key={etapa} className="rounded-xl p-3 shrink-0 w-48"
                style={{ backgroundColor:'white', border:'1px solid #E2E8E2', minWidth:200 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="label-caps" style={{ color:'#1C2A22' }}>{ETAPA_LABEL[etapa]}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor:'#F0F4F1', color:'#9CA3AF' }}>{etapaLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {etapaLeads.map(l => (
                    <div key={l.id} className="rounded-lg p-3 text-xs"
                      style={{ backgroundColor:'#F5F7F5' }}>
                      <p className="font-medium mb-1" style={{ color:'#1C2A22' }}>{l.nombre} {l.apellidos}</p>
                      <div className="flex items-center justify-between">
                        <span style={{ color:'#9CA3AF' }}>{l.canal}</span>
                        <span className="font-semibold" style={{
                          color: l.score >= 70 ? '#166534' : l.score >= 40 ? '#B07D1A' : '#9CA3AF'
                        }}>{l.score}pts</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button className="p-1 rounded transition-colors"
                          style={{ color:'#9CA3AF' }}
                          onMouseEnter={e => e.currentTarget.style.color='#166534'}
                          onMouseLeave={e => e.currentTarget.style.color='#9CA3AF'}>
                          <MessageCircle size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {etapaLeads.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color:'#9CA3AF' }}>Sin leads</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {showCreate && (
        <ClienteModal title="Nuevo cliente" form={form} setForm={setForm} planes={planes}
          onSave={crearCliente} onCancel={() => { setShowCreate(false); setError('') }}
          saving={saving} error={error} />
      )}
      {editTarget && (
        <ClienteModal title={`Editar — ${editTarget.nombre}`} form={form} setForm={setForm} planes={planes}
          onSave={actualizarCliente} onCancel={() => { setEditTarget(null); setError('') }}
          saving={saving} error={error} />
      )}
      {deleteTarget && (
        <ConfirmarEliminar cliente={deleteTarget}
          onConfirm={eliminarCliente} onCancel={() => setDeleteTarget(null)} deleting={deleting} />
      )}
    </div>
  )
}

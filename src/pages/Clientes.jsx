import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import {
  Search, Filter, Plus, MessageCircle, Phone,
  Star, AlertTriangle, ChevronDown, X
} from 'lucide-react'

const ETAPAS_LEAD = ['nuevo','contactado','interesado','prueba_gratis','convertido','perdido']
const ETAPA_LABEL = { nuevo:'Nuevo', contactado:'Contactado', interesado:'Interesado', prueba_gratis:'Prueba gratis', convertido:'Convertido', perdido:'Perdido' }
const RIESGO_BADGE = { bajo:'badge-green', medio:'badge-yellow', alto:'bg-orange-100 text-orange-700 badge', critico:'badge-red' }
const STATUS_BADGE = { activo:'badge-green', inactivo:'badge-gray', suspendido:'badge-yellow', cancelado:'badge-red', prueba:'badge-blue' }

export default function Clientes() {
  const [tab, setTab]             = useState('clientes') // clientes | leads | riesgo
  const [clientes, setClientes]   = useState([])
  const [leads, setLeads]         = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)

  // Nuevo cliente form
  const [form, setForm] = useState({ nombre:'', apellidos:'', email:'', telefono:'', plan_id:'' })
  const [planes, setPlanes]       = useState([])

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    if (tab === 'clientes' || tab === 'riesgo') {
      const q = supabase.from('clientes')
        .select('id, nombre, apellidos, email, telefono, status, riesgo_churn, score_churn, dias_sin_visita, visitas_semana_prom, total_clases, fecha_alta, canal_origen')
        .order('dias_sin_visita', { ascending: false })
      if (tab === 'riesgo') q.in('riesgo_churn', ['alto','critico'])
      const { data } = await q
      setClientes(data ?? [])
    } else {
      const { data } = await supabase.from('leads')
        .select('*')
        .order('score', { ascending: false })
      setLeads(data ?? [])
    }
    const { data: p } = await supabase.from('planes').select('id, nombre, precio_mensual').eq('activo', true)
    setPlanes(p ?? [])
    setLoading(false)
  }

  async function crearCliente() {
    if (!form.nombre || !form.telefono) return
    await supabase.from('clientes').insert({
      nombre: form.nombre, apellidos: form.apellidos,
      email: form.email, telefono: form.telefono,
    })
    setShowNew(false)
    setForm({ nombre:'', apellidos:'', email:'', telefono:'', plan_id:'' })
    loadData()
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
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> Nuevo cliente
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-cs-border rounded-xl p-1 w-fit">
        {[
          { key:'clientes', label:'Clientes' },
          { key:'leads',    label:'Pipeline Leads' },
          { key:'riesgo',   label:'En Riesgo' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-cs-charcoal text-white' : 'text-cs-muted hover:text-cs-charcoal'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cs-muted" />
        <input
          className="input pl-8"
          placeholder="Buscar por nombre, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (

        /* TAB: CLIENTES / RIESGO */
        (tab === 'clientes' || tab === 'riesgo') ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cs-border bg-cs-cream/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Riesgo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Días sin visita</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Vis/sem</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Clases total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-cs-muted text-sm">Sin resultados</td></tr>
                ) : filteredClientes.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cs-gold/15 flex items-center justify-center text-xs font-bold text-cs-gold shrink-0">
                          {c.nombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-cs-charcoal">{c.nombre} {c.apellidos}</p>
                          <p className="text-xs text-cs-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[c.status] ?? 'badge-gray'}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={RIESGO_BADGE[c.riesgo_churn] ?? 'badge-gray'}>
                        {c.riesgo_churn}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={c.dias_sin_visita >= 14 ? 'text-cs-rose font-semibold' : 'text-cs-charcoal'}>
                        {c.dias_sin_visita === 999 ? '—' : `${c.dias_sin_visita}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cs-charcoal">{c.visitas_semana_prom ?? '—'}</td>
                    <td className="px-4 py-3 text-cs-charcoal">{c.total_clases}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-cs-cream text-cs-muted hover:text-emerald-600 transition-colors" title="WhatsApp">
                          <MessageCircle size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-cs-cream text-cs-muted hover:text-cs-charcoal transition-colors" title="Llamar">
                          <Phone size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (

        /* TAB: LEADS - KANBAN */
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto pb-2">
          {ETAPAS_LEAD.filter(e => e !== 'perdido').map(etapa => {
            const etapaLeads = filteredLeads.filter(l => l.etapa === etapa)
            return (
              <div key={etapa} className="bg-white border border-cs-border rounded-xl p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-cs-charcoal uppercase tracking-wide">{ETAPA_LABEL[etapa]}</p>
                  <span className="text-xs bg-cs-cream px-2 py-0.5 rounded-full text-cs-muted">{etapaLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {etapaLeads.map(l => (
                    <div key={l.id} className="bg-cs-cream rounded-lg p-3 text-xs">
                      <p className="font-medium text-cs-charcoal mb-1">{l.nombre} {l.apellidos}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-cs-muted">{l.canal}</span>
                        <span className={`font-semibold ${l.score >= 70 ? 'text-emerald-600' : l.score >= 40 ? 'text-amber-600' : 'text-cs-muted'}`}>
                          {l.score}pts
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <button className="p-1 rounded hover:bg-white text-cs-muted hover:text-emerald-600">
                          <MessageCircle size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {etapaLeads.length === 0 && (
                    <p className="text-xs text-cs-muted text-center py-4">Sin leads</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )
      )}

      {/* Modal nuevo cliente */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-cs-charcoal">Nuevo cliente</h3>
              <button onClick={() => setShowNew(false)} className="text-cs-muted hover:text-cs-charcoal">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Nombre *</label>
                  <input className="input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cs-charcoal mb-1">Apellidos</label>
                  <input className="input" value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Teléfono / WhatsApp *</label>
                <input className="input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-cs-charcoal mb-1">Plan</label>
                <select className="input" value={form.plan_id} onChange={e => setForm({...form, plan_id: e.target.value})}>
                  <option value="">Sin plan por ahora</option>
                  {planes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} — ${p.precio_mensual}/mes</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-ghost flex-1" onClick={() => setShowNew(false)}>Cancelar</button>
                <button className="btn-primary flex-1 justify-center" onClick={crearCliente}>Crear cliente</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

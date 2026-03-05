import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import {
  CreditCard, Clock, AlertTriangle, TrendingUp,
  Plus, X, Search, ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_BADGE = {
  completado: 'badge-green',
  pendiente:  'badge-yellow',
  fallido:    'badge-red',
  reembolsado:'badge-gray',
}
const METODOS = [
  { value:'efectivo',    label:'Efectivo',     emoji:'💵' },
  { value:'tarjeta',     label:'Tarjeta',       emoji:'💳' },
  { value:'spei',        label:'SPEI / Transf.', emoji:'🏦' },
  { value:'mercadopago', label:'Mercado Pago',  emoji:'🟦' },
  { value:'oxxo',        label:'OXXO',          emoji:'🟠' },
]
const CONCEPTOS = [
  'Mensualidad', 'Paquete de clases', 'Clase suelta',
  'Inscripción', 'Renovación plan', 'Producto / artículo', 'Otro',
]
const FORM_INIT = {
  cliente_id: '', concepto: '', concepto_libre: '',
  monto: '', descuento: '0', metodo: 'efectivo',
  status: 'completado', fecha_pago: format(new Date(), 'yyyy-MM-dd'),
  notas: '',
}

const Lbl = ({ children, optional }) => (
  <label className="block mb-1.5" style={{ fontSize:12, fontWeight:500, color:'#4B5563' }}>
    {children} {optional && <span style={{ color:'#9CA3AF', fontWeight:400 }}>(opcional)</span>}
  </label>
)

/* ── Modal registrar pago ─────────────────────── */
function ModalPago({ clientes, onClose, onSaved }) {
  const [form, setForm]     = useState(FORM_INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [search, setSearch] = useState('')

  const clientesFilt = clientes.filter(c =>
    `${c.nombre} ${c.apellidos}`.toLowerCase().includes(search.toLowerCase())
  )
  const clienteSel = clientes.find(c => c.id === form.cliente_id)

  const montoNum    = parseFloat(form.monto)     || 0
  const descuentoNum= parseFloat(form.descuento) || 0
  const montoFinal  = Math.max(montoNum - descuentoNum, 0)

  const conceptoFinal = form.concepto === 'Otro' ? form.concepto_libre : form.concepto

  async function guardar() {
    setError('')
    if (!form.cliente_id)    { setError('Selecciona un cliente.'); return }
    if (!conceptoFinal)      { setError('Indica el concepto del pago.'); return }
    if (!montoNum || montoNum <= 0) { setError('El monto debe ser mayor a $0.'); return }

    setSaving(true)
    const { error: err } = await supabase.from('pagos').insert({
      cliente_id:  form.cliente_id,
      concepto:    conceptoFinal,
      monto:       montoNum,
      descuento:   descuentoNum,
      monto_final: montoFinal,
      metodo:      form.metodo,
      status:      form.status,
      fecha_pago:  form.status === 'completado' ? new Date(form.fecha_pago).toISOString() : null,
      notas:       form.notas || null,
    })
    setSaving(false)
    if (err) { setError('Error: ' + err.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-white border-b"
          style={{ borderColor:'#E2E8E2' }}>
          <h3 className="font-display text-2xl" style={{ color:'#111827', letterSpacing:'-0.02em' }}>
            Registrar pago
          </h3>
          <button onClick={onClose} className="p-1 hover:text-gray-600 transition-colors"
            style={{ color:'#9CA3AF' }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* ── Cliente ─────────────────────────── */}
          <div>
            <Lbl>Cliente *</Lbl>
            {clienteSel ? (
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor:'#EBF2E9', border:'1px solid #C5D9C0' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor:'#4F7C44' }}>
                    {clienteSel.nombre?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color:'#1C2A22' }}>
                      {clienteSel.nombre} {clienteSel.apellidos}
                    </p>
                    <p style={{ fontSize:11, color:'#9CA3AF' }}>{clienteSel.email}</p>
                  </div>
                </div>
                <button onClick={() => setForm(f => ({ ...f, cliente_id:'' }))}
                  style={{ color:'#9CA3AF' }} className="hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color:'#9CA3AF' }} />
                  <input className="input pl-8" placeholder="Buscar cliente…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-xl border"
                  style={{ borderColor:'#E2E8E2' }}>
                  {clientesFilt.slice(0,10).map(c => (
                    <button key={c.id}
                      onClick={() => { setForm(f => ({ ...f, cliente_id:c.id })); setSearch('') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{ borderBottom:'1px solid #F0F4F1' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#F5F7F5'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor:'#4F7C44' }}>
                        {c.nombre?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color:'#1C2A22' }}>
                          {c.nombre} {c.apellidos}
                        </p>
                        {c.email && <p style={{ fontSize:11, color:'#9CA3AF' }}>{c.email}</p>}
                      </div>
                    </button>
                  ))}
                  {clientesFilt.length === 0 && (
                    <p className="px-4 py-3 text-sm text-center" style={{ color:'#9CA3AF' }}>
                      Sin resultados
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Concepto ───────────────────────── */}
          <div>
            <Lbl>Concepto *</Lbl>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {CONCEPTOS.map(c => (
                <button key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, concepto:c, concepto_libre:'' }))}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                  style={{
                    backgroundColor: form.concepto === c ? '#1C2A22' : '#F5F7F5',
                    color: form.concepto === c ? 'white' : '#4B5563',
                    border: form.concepto === c ? 'none' : '1px solid #E2E8E2',
                  }}>
                  {c}
                </button>
              ))}
            </div>
            {form.concepto === 'Otro' && (
              <input className="input mt-1" placeholder="Describe el concepto…"
                value={form.concepto_libre}
                onChange={e => setForm(f => ({ ...f, concepto_libre:e.target.value }))} />
            )}
          </div>

          {/* ── Método de pago ─────────────────── */}
          <div>
            <Lbl>Método de pago *</Lbl>
            <div className="flex gap-2 flex-wrap">
              {METODOS.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setForm(f => ({ ...f, metodo:m.value }))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    backgroundColor: form.metodo === m.value ? '#1C2A22' : '#F5F7F5',
                    color: form.metodo === m.value ? 'white' : '#4B5563',
                    border: form.metodo === m.value ? 'none' : '1px solid #E2E8E2',
                  }}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Monto ──────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Lbl>Monto *</Lbl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color:'#9CA3AF' }}>$</span>
                <input type="number" className="input pl-7" min="0" step="0.01"
                  placeholder="0.00" value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto:e.target.value }))} />
              </div>
            </div>
            <div>
              <Lbl optional>Descuento</Lbl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color:'#9CA3AF' }}>$</span>
                <input type="number" className="input pl-7" min="0" step="0.01"
                  placeholder="0.00" value={form.descuento}
                  onChange={e => setForm(f => ({ ...f, descuento:e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Total */}
          {montoNum > 0 && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor:'#F5F7F5', border:'1px solid #E2E8E2' }}>
              <p className="text-sm" style={{ color:'#4B5563' }}>Total a cobrar</p>
              <p className="font-display text-2xl" style={{ color:'#1C2A22', letterSpacing:'-0.02em' }}>
                ${montoFinal.toLocaleString('es-MX', { minimumFractionDigits:2 })}
              </p>
            </div>
          )}

          {/* ── Status ─────────────────────────── */}
          <div>
            <Lbl>Status del pago *</Lbl>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value:'completado', label:'Completado', color:'#166534', bg:'#DCFCE7' },
                { value:'pendiente',  label:'Pendiente',  color:'#92400E', bg:'#FEF9C3' },
                { value:'fallido',    label:'Fallido',    color:'#991B1B', bg:'#FEE2E2' },
              ].map(s => (
                <button key={s.value} type="button"
                  onClick={() => setForm(f => ({ ...f, status:s.value }))}
                  className="py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    backgroundColor: form.status === s.value ? s.bg : '#F5F7F5',
                    color: form.status === s.value ? s.color : '#9CA3AF',
                    border: form.status === s.value ? `1.5px solid ${s.color}30` : '1px solid #E2E8E2',
                    fontWeight: form.status === s.value ? 600 : 400,
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha (solo si completado) */}
          {form.status === 'completado' && (
            <div>
              <Lbl>Fecha de pago</Lbl>
              <input type="date" className="input" value={form.fecha_pago}
                onChange={e => setForm(f => ({ ...f, fecha_pago:e.target.value }))} />
            </div>
          )}

          {/* Notas */}
          <div>
            <Lbl optional>Notas internas</Lbl>
            <textarea className="input" rows={2} placeholder="Referencia, observación…"
              style={{ resize:'none' }} value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas:e.target.value }))} />
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-1 pb-1">
            <button className="btn-ghost flex-1 justify-center" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary flex-1 justify-center" onClick={guardar} disabled={saving}>
              {saving
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando…</>
                : <><CreditCard size={14} /> Registrar pago</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
export default function Pagos() {
  const [pagos, setPagos]       = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [mes] = useState(new Date())

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1).toISOString()
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('pagos')
        .select('*, clientes(nombre,apellidos,email)')
        .gte('created_at', inicio)
        .order('created_at', { ascending:false })
        .limit(100),
      supabase.from('clientes')
        .select('id,nombre,apellidos,email')
        .eq('status','activo')
        .order('nombre'),
    ])
    setPagos(p ?? [])
    setClientes(c ?? [])
    setLoading(false)
  }

  const cobrado   = pagos.filter(p=>p.status==='completado').reduce((s,p)=>s+(p.monto_final??0),0)
  const pendiente = pagos.filter(p=>p.status==='pendiente').reduce((s,p)=>s+(p.monto_final??0),0)
  const fallido   = pagos.filter(p=>p.status==='fallido').reduce((s,p)=>s+(p.monto_final??0),0)
  const tasa      = pagos.length > 0
    ? Math.round((pagos.filter(p=>p.status==='completado').length/pagos.length)*100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Pagos"
        subtitle={`Cobros · ${format(mes, "MMMM yyyy", { locale:es })}`}
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Registrar pago
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Cobrado en el mes" value={`$${cobrado.toLocaleString('es-MX')}`} icon={TrendingUp} />
        <KPICard title="Pendiente" value={`$${pendiente.toLocaleString('es-MX')}`} icon={Clock} alert={pendiente>0} />
        <KPICard title="Fallido"   value={`$${fallido.toLocaleString('es-MX')}`}   icon={AlertTriangle} alert={fallido>0} />
        <KPICard title="Tasa de cobro" value={`${tasa}%`} icon={CreditCard} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor:'#3E6335', borderTopColor:'transparent' }} />
        </div>
      ) : pagos.length === 0 ? (
        <div className="card p-12 text-center" style={{ color:'#9CA3AF' }}>
          <p style={{ fontSize:32, marginBottom:8 }}>💳</p>
          Sin pagos registrados este mes
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom:'1px solid #E2E8E2', backgroundColor:'#F5F7F5' }}>
                {['Cliente','Concepto','Método','Monto','Status','Fecha'].map(h => (
                  <th key={h} className="text-left px-4 py-3 label-caps">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => {
                const metodo = METODOS.find(m => m.value === p.metodo)
                return (
                  <tr key={p.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color:'#1C2A22' }}>
                        {p.clientes?.nombre} {p.clientes?.apellidos}
                      </p>
                      {p.clientes?.email && (
                        <p className="text-xs" style={{ color:'#9CA3AF' }}>{p.clientes.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color:'#4B5563' }}>{p.concepto}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span>{metodo?.emoji ?? '💰'}</span>
                        <span style={{ color:'#1C2A22' }}>{metodo?.label ?? p.metodo}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color:'#1C2A22' }}>
                        ${(p.monto_final ?? p.monto ?? 0).toLocaleString('es-MX', { minimumFractionDigits:2 })}
                      </p>
                      {p.descuento > 0 && (
                        <p style={{ fontSize:11, color:'#9CA3AF' }}>
                          −${p.descuento.toLocaleString('es-MX')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[p.status] ?? 'badge-gray'}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color:'#9CA3AF' }}>
                      {p.fecha_pago
                        ? format(new Date(p.fecha_pago), "d MMM yyyy", { locale:es })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ModalPago
          clientes={clientes}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData() }}
        />
      )}
    </div>
  )
}

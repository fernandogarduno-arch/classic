import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { DollarSign, CheckCircle, Clock, Plus, Play } from 'lucide-react'

export default function Nomina() {
  const [periodos, setPeriodos]   = useState([])
  const [lineas, setLineas]       = useState([])
  const [periodoSel, setPeriodoSel] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase.from('periodos_nomina')
      .select('*').order('fecha_inicio', { ascending: false })
      .then(({ data }) => {
        setPeriodos(data ?? [])
        if (data?.[0]) {
          setPeriodoSel(data[0].id)
        } else {
          setLoading(false)
        }
      })
  }, [])

  useEffect(() => {
    if (!periodoSel) return
    setLoading(true)
    supabase.from('nomina_lineas')
      .select('*, instructoras(nombre, apellidos, color_hex)')
      .eq('periodo_id', periodoSel)
      .then(({ data }) => { setLineas(data ?? []); setLoading(false) })
  }, [periodoSel])

  const totalNomina   = lineas.reduce((s, l) => s + (l.total ?? 0), 0)
  const totalPendiente= lineas.filter(l => l.status === 'pendiente').reduce((s, l) => s + (l.total ?? 0), 0)
  const totalPagado   = lineas.filter(l => l.status === 'pagada').reduce((s, l) => s + (l.total ?? 0), 0)

  async function aprobarLinea(id) {
    await supabase.from('nomina_lineas').update({ status: 'aprobada' }).eq('id', id)
    setLineas(prev => prev.map(l => l.id === id ? { ...l, status: 'aprobada' } : l))
  }
  async function pagarLinea(id) {
    await supabase.from('nomina_lineas').update({ status: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] }).eq('id', id)
    setLineas(prev => prev.map(l => l.id === id ? { ...l, status: 'pagada' } : l))
  }

  const STATUS_BADGE = { pendiente: 'badge-yellow', aprobada: 'badge-blue', pagada: 'badge-green' }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Nómina"
        subtitle="Cálculo automático por período"
        actions={<button className="btn-primary"><Plus size={15} /> Nuevo período</button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <KPICard title="Total período"  value={`$${totalNomina.toLocaleString('es-MX')}`}    icon={DollarSign} />
        <KPICard title="Pendiente pago" value={`$${totalPendiente.toLocaleString('es-MX')}`} icon={Clock}      alert={totalPendiente > 0} />
        <KPICard title="Ya pagado"      value={`$${totalPagado.toLocaleString('es-MX')}`}    icon={CheckCircle}/>
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-cs-charcoal">Período:</label>
        <select className="input max-w-xs" value={periodoSel ?? ''} onChange={e => setPeriodoSel(e.target.value)}>
          {periodos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
          {periodos.length === 0 && <option value="">Sin períodos</option>}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lineas.length === 0 ? (
        <div className="card p-12 text-center text-cs-muted">
          <p className="mb-3">Sin líneas de nómina para este período</p>
          <button className="btn-primary mx-auto"><Play size={14} /> Calcular nómina</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cs-border bg-cs-cream/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Instructora</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-cs-muted uppercase">Clases</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-cs-muted uppercase">Fee/clase</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-cs-muted uppercase">Subtotal</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-cs-muted uppercase">Bonos</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-cs-muted uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lineas.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: l.instructoras?.color_hex ?? '#B5703A' }}>
                        {l.instructoras?.nombre?.[0]}
                      </div>
                      <span className="font-medium text-cs-charcoal">{l.instructoras?.nombre} {l.instructoras?.apellidos}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{l.clases_impartidas}</td>
                  <td className="px-4 py-3 text-right">${l.fee_por_clase}</td>
                  <td className="px-4 py-3 text-right">${l.subtotal_clases?.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">+${((l.bono_puntualidad ?? 0) + (l.bono_meta ?? 0) + (l.bono_ocupacion ?? 0)).toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-cs-charcoal">${l.total?.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3"><span className={STATUS_BADGE[l.status]}>{l.status}</span></td>
                  <td className="px-4 py-3">
                    {l.status === 'pendiente' && (
                      <button onClick={() => aprobarLinea(l.id)} className="text-xs text-cs-gold hover:underline">Aprobar</button>
                    )}
                    {l.status === 'aprobada' && (
                      <button onClick={() => pagarLinea(l.id)} className="btn-primary text-xs py-1">Pagar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-cs-cream/50 border-t-2 border-cs-border">
                <td colSpan={5} className="px-4 py-3 font-semibold text-cs-charcoal text-sm">Total período</td>
                <td className="px-4 py-3 text-right font-bold text-cs-charcoal">${totalNomina.toLocaleString('es-MX')}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

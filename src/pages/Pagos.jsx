import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { CreditCard, Clock, AlertTriangle, TrendingUp, Plus } from 'lucide-react'

const STATUS_BADGE = { completado:'badge-green', pendiente:'badge-yellow', fallido:'badge-red', reembolsado:'badge-gray' }
const METODO_ICON  = { tarjeta:'💳', mercadopago:'🟦', oxxo:'🟠', spei:'🏦', efectivo:'💵' }

export default function Pagos() {
  const [pagos, setPagos]     = useState([])
  const [loading, setLoading] = useState(true)
  const [mes]                 = useState(new Date())

  useEffect(() => {
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1).toISOString()
    supabase.from('pagos')
      .select('*, clientes(nombre, apellidos)')
      .gte('created_at', inicio)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setPagos(data ?? []); setLoading(false) })
  }, [])

  const cobrado   = pagos.filter(p => p.status === 'completado').reduce((s,p) => s + (p.monto_final ?? 0), 0)
  const pendiente = pagos.filter(p => p.status === 'pendiente').reduce((s,p) => s + (p.monto_final ?? 0), 0)
  const fallido   = pagos.filter(p => p.status === 'fallido').reduce((s,p) => s + (p.monto_final ?? 0), 0)
  const tasa      = pagos.length > 0 ? Math.round((pagos.filter(p=>p.status==='completado').length / pagos.length) * 100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Pagos"
        subtitle="Cobros y cobranza del mes"
        actions={<button className="btn-primary"><Plus size={15} /> Registrar pago</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Cobrado en el mes"  value={`$${cobrado.toLocaleString('es-MX')}`}   icon={TrendingUp}     />
        <KPICard title="Pendiente"          value={`$${pendiente.toLocaleString('es-MX')}`}  icon={Clock}          alert={pendiente > 0} />
        <KPICard title="Fallido"            value={`$${fallido.toLocaleString('es-MX')}`}    icon={AlertTriangle}  alert={fallido > 0} />
        <KPICard title="Tasa de cobro"      value={`${tasa}%`}                               icon={CreditCard}     />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pagos.length === 0 ? (
        <div className="card p-12 text-center text-cs-muted">Sin pagos registrados este mes</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cs-border bg-cs-cream/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Concepto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Método</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-cs-muted uppercase">Monto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-cs-muted uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-cs-charcoal">{p.clientes?.nombre} {p.clientes?.apellidos}</td>
                  <td className="px-4 py-3 text-cs-muted">{p.concepto}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span>{METODO_ICON[p.metodo]}</span>
                      <span className="text-cs-charcoal capitalize">{p.metodo}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-cs-charcoal">
                    ${p.monto_final?.toLocaleString('es-MX')}
                  </td>
                  <td className="px-4 py-3"><span className={STATUS_BADGE[p.status] ?? 'badge-gray'}>{p.status}</span></td>
                  <td className="px-4 py-3 text-cs-muted text-xs">
                    {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

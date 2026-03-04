import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { DollarSign, TrendingDown, TrendingUp, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Datos de egresos por categoría (en producción vendrían de una tabla egresos)
const EGRESOS_MOCK = [
  { categoria: 'Nómina instructoras', monto: 38500, pct: 44 },
  { categoria: 'Renta y mantenimiento', monto: 16800, pct: 19 },
  { categoria: 'Marketing', monto: 6200, pct: 7 },
  { categoria: 'Servicios / Utilidades', monto: 4400, pct: 5 },
  { categoria: 'Equipo y reparaciones', monto: 3500, pct: 4 },
  { categoria: 'Operaciones varias', monto: 18300, pct: 21 },
]

const MRR_TREND_MOCK = [
  { mes:'Oct', ingresos:72000, egresos:85000 },
  { mes:'Nov', ingresos:78500, egresos:89000 },
  { mes:'Dic', ingresos:75200, egresos:82000 },
  { mes:'Ene', ingresos:83100, egresos:91000 },
  { mes:'Feb', ingresos:88400, egresos:94000 },
  { mes:'Mar', ingresos:91200, egresos:87700 },
]

export default function Finanzas() {
  const [mrr, setMrr]       = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    supabase.from('pagos')
      .select('monto_final')
      .eq('status', 'completado')
      .gte('fecha_pago', inicio)
      .then(({ data }) => {
        setMrr((data ?? []).reduce((s, p) => s + (p.monto_final ?? 0), 0))
        setLoading(false)
      })
  }, [])

  const totalEgresos = EGRESOS_MOCK.reduce((s, e) => s + e.monto, 0)
  const utilidad     = mrr - totalEgresos
  const margen       = mrr > 0 ? Math.round((utilidad / mrr) * 100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Finanzas" subtitle="Ingresos · Egresos · Proyección" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Ingresos del mes" value={`$${mrr.toLocaleString('es-MX')}`}           icon={TrendingUp}   />
        <KPICard title="Egresos del mes"  value={`$${totalEgresos.toLocaleString('es-MX')}`}   icon={TrendingDown} />
        <KPICard
          title="Utilidad neta"
          value={`${utilidad >= 0 ? '' : '-'}$${Math.abs(utilidad).toLocaleString('es-MX')}`}
          icon={DollarSign}
          alert={utilidad < 0}
        />
        <KPICard title="Margen bruto" value={`${margen}%`} icon={Percent} alert={margen < 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendencia */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-medium text-cs-charcoal mb-1">Ingresos vs Egresos</p>
          <p className="text-xs text-cs-muted mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MRR_TREND_MOCK}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#8C8C8C' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v/1000}k`} tick={{ fontSize: 11, fill: '#8C8C8C' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [`$${v.toLocaleString('es-MX')}`, '']} />
              <Legend formatter={v => v === 'ingresos' ? 'Ingresos' : 'Egresos'} />
              <Bar dataKey="ingresos" fill="#5E8A6E" radius={[4,4,0,0]} />
              <Bar dataKey="egresos"  fill="#C25C6E" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estructura de costos */}
        <div className="card p-5">
          <p className="text-sm font-medium text-cs-charcoal mb-4">Estructura de costos</p>
          <div className="space-y-3">
            {EGRESOS_MOCK.map(e => (
              <div key={e.categoria}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-cs-charcoal">{e.categoria}</p>
                  <span className="text-xs font-medium text-cs-muted">{e.pct}%</span>
                </div>
                <div className="h-1.5 bg-cs-cream rounded-full overflow-hidden">
                  <div className="h-full bg-cs-gold rounded-full" style={{ width: `${e.pct}%` }} />
                </div>
                <p className="text-xs text-cs-muted mt-0.5">${e.monto.toLocaleString('es-MX')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

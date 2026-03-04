import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import KPICard from '../components/KPICard'
import PageHeader from '../components/PageHeader'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import {
  Users, AlertTriangle, CalendarDays, TrendingUp,
  DollarSign, Activity, ArrowRight, Zap
} from 'lucide-react'

const RIESGO_COLOR = { bajo: '#5E8A6E', medio: '#C49A2A', alto: '#E07A3A', critico: '#C25C6E' }
const RIESGO_BADGE = {
  bajo:    'badge-green',
  medio:   'badge-yellow',
  alto:    'bg-orange-100 text-orange-700 badge',
  critico: 'badge-red',
}
const RIESGO_LABEL = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis]           = useState(null)
  const [atRisk, setAtRisk]       = useState([])
  const [autoStats, setAutoStats] = useState([])
  const [loading, setLoading]     = useState(true)

  // Datos mock de tendencia MRR (se reemplazará con datos reales de pagos)
  const mrrData = [
    { mes: 'Oct', mrr: 72000 }, { mes: 'Nov', mrr: 78500 }, { mes: 'Dic', mrr: 75200 },
    { mes: 'Ene', mrr: 83100 }, { mes: 'Feb', mrr: 88400 }, { mes: 'Mar', mrr: 91200 },
  ]

  const disciplinaData = [
    { name: 'Reformer',  occ: 94 }, { name: 'Yoga Flow', occ: 88 },
    { name: 'Barre',     occ: 82 }, { name: 'Mat',       occ: 76 },
    { name: 'TRX',       occ: 65 }, { name: 'Meditación',occ: 58 },
  ]

  useEffect(() => {
    async function load() {
      const [
        { count: totalClientes },
        { count: clientesActivos },
        { data: atRiskData },
        { data: autoData },
        { count: clasesHoy },
        { data: pagosData },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('status', 'activo'),
        supabase.from('clientes')
          .select('id, nombre, apellidos, riesgo_churn, dias_sin_visita, visitas_semana_prom')
          .in('riesgo_churn', ['alto', 'critico'])
          .order('dias_sin_visita', { ascending: false })
          .limit(5),
        supabase.from('automatizaciones')
          .select('nombre, total_enviados, total_abiertos, activa')
          .eq('activa', true)
          .order('total_enviados', { ascending: false })
          .limit(5),
        supabase.from('sesiones')
          .select('*', { count: 'exact', head: true })
          .eq('fecha', new Date().toISOString().split('T')[0])
          .eq('cancelada', false),
        supabase.from('pagos')
          .select('monto_final')
          .eq('status', 'completado')
          .gte('fecha_pago', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ])

      const mrr = (pagosData ?? []).reduce((s, p) => s + (p.monto_final ?? 0), 0)

      setKpis({
        totalClientes: totalClientes ?? 0,
        clientesActivos: clientesActivos ?? 0,
        mrr,
        atRiskCount: (atRiskData ?? []).length,
        clasesHoy: clasesHoy ?? 0,
      })
      setAtRisk(atRiskData ?? [])
      setAutoStats(autoData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 lg:p-8 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const fmt = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`${new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`}
      />

      {/* Alerta clientes en riesgo */}
      {atRisk.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            <p className="text-sm font-medium">
              {atRisk.length} cliente{atRisk.length > 1 ? 's' : ''} en riesgo de baja —&nbsp;
              <span className="text-amber-600">requieren atención hoy</span>
            </p>
          </div>
          <button onClick={() => navigate('/clientes?tab=riesgo')} className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Clientes activos"    value={kpis.clientesActivos} subtitle={`${kpis.totalClientes} total`} icon={Users}        trend={2.1}  trendLabel="vs mes anterior" />
        <KPICard title="MRR del mes"         value={fmt(kpis.mrr)}        subtitle="Ingresos recurrentes"          icon={DollarSign}   trend={3.2}  trendLabel="vs mes anterior" />
        <KPICard title="Clases hoy"          value={kpis.clasesHoy}       subtitle="Sesiones programadas"          icon={CalendarDays} trend={0}    trendLabel="igual que ayer" />
        <KPICard title="En riesgo de baja"   value={atRisk.length}        subtitle="Requieren contacto"            icon={AlertTriangle} trend={-1}  trendLabel="vs semana anterior" alert={atRisk.length > 0} />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MRR trend */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-medium text-cs-charcoal mb-1">Evolución MRR</p>
          <p className="text-xs text-cs-muted mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C49A2A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C49A2A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#8C8C8C' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v/1000}k`} tick={{ fontSize: 11, fill: '#8C8C8C' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [`$${v.toLocaleString('es-MX')}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#C49A2A" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ocupación por disciplina */}
        <div className="card p-5">
          <p className="text-sm font-medium text-cs-charcoal mb-1">Ocupación por disciplina</p>
          <p className="text-xs text-cs-muted mb-4">Promedio del mes</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={disciplinaData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#8C8C8C' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8C8C8C' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={v => [`${v}%`, 'Ocupación']} />
              <Bar dataKey="occ" radius={4}>
                {disciplinaData.map((d, i) => (
                  <Cell key={i} fill={d.occ >= 80 ? '#5E8A6E' : d.occ >= 65 ? '#C49A2A' : '#C25C6E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clientes en riesgo + Automatizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Clientes en riesgo */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-cs-charcoal">Clientes en riesgo</p>
            <button onClick={() => navigate('/clientes')} className="text-xs text-cs-gold hover:underline flex items-center gap-1">
              Ver CRM <ArrowRight size={11} />
            </button>
          </div>
          {atRisk.length === 0 ? (
            <p className="text-sm text-cs-muted text-center py-8">🎉 Sin clientes en riesgo hoy</p>
          ) : (
            <div className="space-y-3">
              {atRisk.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-cs-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cs-cream-dk flex items-center justify-center text-xs font-semibold text-cs-charcoal">
                      {c.nombre?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cs-charcoal">{c.nombre} {c.apellidos}</p>
                      <p className="text-xs text-cs-muted">{c.dias_sin_visita} días sin visita</p>
                    </div>
                  </div>
                  <span className={RIESGO_BADGE[c.riesgo_churn]}>
                    {RIESGO_LABEL[c.riesgo_churn]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Automatizaciones activas */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-cs-charcoal">Automatizaciones activas</p>
            <button onClick={() => navigate('/marketing')} className="text-xs text-cs-gold hover:underline flex items-center gap-1">
              Gestionar <ArrowRight size={11} />
            </button>
          </div>
          {autoStats.length === 0 ? (
            <p className="text-sm text-cs-muted text-center py-8">Sin automatizaciones activas</p>
          ) : (
            <div className="space-y-3">
              {autoStats.map(a => {
                const openRate = a.total_enviados > 0 ? Math.round((a.total_abiertos / a.total_enviados) * 100) : 0
                return (
                  <div key={a.nombre} className="flex items-center justify-between py-2 border-b border-cs-border last:border-0">
                    <div className="flex items-center gap-2">
                      <Zap size={13} className="text-cs-gold shrink-0" />
                      <p className="text-sm text-cs-charcoal">{a.nombre}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-cs-muted">{a.total_enviados} envíos</span>
                      <span className="text-xs font-medium text-emerald-600">{openRate}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

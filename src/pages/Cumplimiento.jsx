import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, ExternalLink } from 'lucide-react'

const STATUS_CONFIG = {
  al_corriente: { badge: 'badge-green',  icon: '✅', label: 'Al corriente' },
  pendiente:    { badge: 'badge-yellow', icon: '⏳', label: 'Pendiente' },
  revisar:      { badge: 'bg-orange-100 text-orange-700 badge', icon: '⚠️', label: 'Revisar' },
  urgente:      { badge: 'badge-red',    icon: '🔴', label: 'Urgente' },
  vencido:      { badge: 'badge-red',    icon: '❌', label: 'Vencido' },
}
const TIPO_LABEL = { fiscal:'Fiscal', legal:'Legal', laboral:'Laboral', operativo:'Operativo', digital:'Digital' }
const TIPO_COLOR = { fiscal:'bg-blue-100 text-blue-700', legal:'bg-purple-100 text-purple-700', laboral:'bg-amber-100 text-amber-700', operativo:'bg-green-100 text-green-700', digital:'bg-gray-100 text-gray-600' }

export default function Cumplimiento() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState('todos')

  useEffect(() => {
    supabase.from('cumplimiento_items')
      .select('*')
      .order('fecha_limite', { ascending: true, nullsFirst: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false) })
  }, [])

  async function marcarAlCorriente(id) {
    await supabase.from('cumplimiento_items').update({ status: 'al_corriente', fecha_completado: new Date().toISOString().split('T')[0] }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'al_corriente' } : i))
  }

  const alCorriente = items.filter(i => i.status === 'al_corriente').length
  const requierenAtencion = items.filter(i => ['pendiente','revisar','urgente','vencido'].includes(i.status)).length
  const score = items.length > 0 ? Math.round((alCorriente / items.length) * 100) : 0

  const filtered = filtro === 'todos' ? items : items.filter(i => i.tipo === filtro)

  // Agrupar por tipo
  const grupos = ['fiscal','legal','laboral','operativo','digital']

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader title="Cumplimiento" subtitle="Obligaciones fiscales · Legales · Operativas" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total obligaciones"    value={items.length}           icon={ShieldCheck}   />
        <KPICard title="Al corriente"          value={alCorriente}            icon={CheckCircle2}  />
        <KPICard title="Requieren atención"    value={requierenAtencion}      icon={AlertTriangle} alert={requierenAtencion > 0} />
        <KPICard title="Score de cumplimiento" value={`${score}%`}            icon={ShieldCheck}   />
      </div>

      {requierenAtencion > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-red-800 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{requierenAtencion} obligacion{requierenAtencion > 1 ? 'es' : ''} requieren{requierenAtencion > 1 ? '' : ''} atención inmediata</span>
        </div>
      )}

      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-2">
        {['todos', ...grupos].map(t => (
          <button
            key={t}
            onClick={() => setFiltro(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filtro === t ? 'bg-cs-charcoal text-white' : 'bg-white border border-cs-border text-cs-muted hover:text-cs-charcoal'}`}
          >
            {t === 'todos' ? 'Todos' : TIPO_LABEL[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendiente
            return (
              <div key={item.id} className="card p-4 flex items-center gap-4">
                <span className="text-lg shrink-0">{sc.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-cs-charcoal text-sm">{item.titulo}</p>
                    <span className={`badge text-[10px] ${TIPO_COLOR[item.tipo] ?? 'badge-gray'}`}>{TIPO_LABEL[item.tipo]}</span>
                  </div>
                  {item.fecha_limite && (
                    <p className="text-xs text-cs-muted mt-0.5">
                      Vence: {new Date(item.fecha_limite).toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={sc.badge}>{sc.label}</span>
                  {item.link_ref && (
                    <a href={item.link_ref} target="_blank" rel="noopener noreferrer" className="text-cs-muted hover:text-cs-gold">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {item.status !== 'al_corriente' && (
                    <button onClick={() => marcarAlCorriente(item.id)} className="text-xs text-emerald-600 hover:underline whitespace-nowrap">
                      Marcar OK
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="card p-12 text-center text-cs-muted">Sin obligaciones en esta categoría</div>
          )}
        </div>
      )}
    </div>
  )
}

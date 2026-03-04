import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { Zap, MessageCircle, ToggleLeft, ToggleRight, TrendingUp, Send } from 'lucide-react'

export default function Marketing() {
  const [autos, setAutos]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('automatizaciones').select('*').order('total_enviados', { ascending: false })
      .then(({ data }) => { setAutos(data ?? []); setLoading(false) })
  }, [])

  async function toggleAuto(id, activa) {
    await supabase.from('automatizaciones').update({ activa: !activa }).eq('id', id)
    setAutos(prev => prev.map(a => a.id === id ? { ...a, activa: !activa } : a))
  }

  const totalEnviados  = autos.reduce((s, a) => s + (a.total_enviados ?? 0), 0)
  const totalAbiertos  = autos.reduce((s, a) => s + (a.total_abiertos ?? 0), 0)
  const openRateGlobal = totalEnviados > 0 ? Math.round((totalAbiertos / totalEnviados) * 100) : 0
  const activasCount   = autos.filter(a => a.activa).length

  const CANAL_ICON = { whatsapp: '💬', email: '📧', push: '🔔', sms: '📱' }
  const TRIGGER_LABEL = {
    alta_membresia: 'Alta de membresía',
    recordatorio_clase: 'Recordatorio clase',
    sin_visita_7d: 'Sin visita 7 días',
    sin_visita_14d: 'Sin visita 14 días',
    membresia_por_vencer: 'Membresía por vencer',
    lugar_liberado: 'Lugar liberado',
    cumpleanos: 'Cumpleaños',
    pago_fallido: 'Pago fallido',
    encuesta_post_clase: 'Encuesta post-clase',
    bienvenida_lead: 'Bienvenida lead',
    primer_clase: 'Primera clase',
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Marketing"
        subtitle="Automatizaciones WhatsApp · Retención"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Automatizaciones activas" value={activasCount}                             icon={Zap}           />
        <KPICard title="Mensajes enviados"         value={totalEnviados.toLocaleString('es-MX')}   icon={Send}          />
        <KPICard title="Tasa de apertura"          value={`${openRateGlobal}%`}                    icon={MessageCircle} />
        <KPICard title="MRR recuperado"            value={`$${autos.reduce((s,a)=>s+(a.mrr_salvado??0),0).toLocaleString('es-MX')}`} icon={TrendingUp} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cs-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {autos.map(a => {
            const openRate = a.total_enviados > 0 ? Math.round((a.total_abiertos / a.total_enviados) * 100) : 0
            return (
              <div key={a.id} className={`card p-4 flex items-start gap-4 ${!a.activa ? 'opacity-60' : ''}`}>
                <div className="text-2xl w-10 shrink-0">{CANAL_ICON[a.canal]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-cs-charcoal text-sm">{a.nombre}</p>
                      <p className="text-xs text-cs-muted mt-0.5">Trigger: {TRIGGER_LABEL[a.trigger_tipo] ?? a.trigger_tipo}</p>
                    </div>
                    <button onClick={() => toggleAuto(a.id, a.activa)} className="shrink-0">
                      {a.activa
                        ? <ToggleRight size={24} className="text-cs-gold" />
                        : <ToggleLeft size={24} className="text-cs-muted" />
                      }
                    </button>
                  </div>
                  {/* Plantilla */}
                  <p className="text-xs text-cs-muted mt-2 bg-cs-cream rounded-lg px-3 py-2 line-clamp-2">{a.plantilla}</p>
                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-cs-muted">{a.total_enviados} enviados</span>
                    <span className="text-xs text-emerald-600 font-medium">{openRate}% apertura</span>
                    {a.mrr_salvado > 0 && (
                      <span className="text-xs text-cs-gold font-medium">${a.mrr_salvado.toLocaleString('es-MX')} MRR recuperado</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

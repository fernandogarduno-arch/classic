import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import { Plus, Star, Users, DollarSign, Edit } from 'lucide-react'

const DIAS = ['L','M','X','J','V','S','D']

export default function Instructoras() {
  const [instructoras, setInstructoras] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    supabase.from('instructoras')
      .select('*')
      .eq('activa', true)
      .then(({ data }) => { setInstructoras(data ?? []); setLoading(false) })
  }, [])

  const totalNomina = instructoras.reduce((s, i) => s + (i.fee_por_clase * i.clases_impartidas), 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Instructoras"
        subtitle="Equipo · Disponibilidad · Tarifas"
        actions={<button className="btn-primary"><Plus size={15} /> Agregar instructora</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total activas"   value={instructoras.length}                    icon={Users}       />
        <KPICard title="Nómina estimada" value={`$${totalNomina.toLocaleString('es-MX')}`} icon={DollarSign}  />
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
              <p className="mb-2">Sin instructoras registradas</p>
              <button className="btn-primary mx-auto"><Plus size={14} /> Agregar primera instructora</button>
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
                        <Star size={11} fill="#C49A2A" stroke="none" />
                        <span className="text-xs text-cs-muted">{inst.rating_promedio ?? 5.0}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${inst.disponible_hoy ? 'badge-green' : 'badge-gray'}`}>
                    {inst.disponible_hoy ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                {/* Disciplinas */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(inst.disciplinas ?? []).map(d => (
                    <span key={d} className="badge badge-gold text-[10px]">{d.replace('_',' ')}</span>
                  ))}
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-cs-cream rounded-lg p-2">
                    <p className="font-display text-lg text-cs-charcoal">{inst.clases_impartidas}</p>
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
    </div>
  )
}

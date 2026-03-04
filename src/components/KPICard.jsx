import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, subtitle, trend, trendLabel, icon: Icon, iconColor = 'text-cs-gold', alert = false }) {
  const trendIcon =
    trend > 0 ? <TrendingUp size={12} className="text-emerald-500" /> :
    trend < 0 ? <TrendingDown size={12} className="text-red-500" /> :
    <Minus size={12} className="text-cs-muted" />

  const trendClass =
    trend > 0 ? 'text-emerald-600' :
    trend < 0 ? 'text-red-600' :
    'text-cs-muted'

  return (
    <div className={`kpi-card ${alert ? 'ring-2 ring-cs-rose ring-offset-1' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-cs-muted uppercase tracking-wide">{title}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg bg-cs-cream flex items-center justify-center ${iconColor}`}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <p className="font-display text-3xl text-cs-charcoal mb-1">{value}</p>
      {subtitle && <p className="text-xs text-cs-muted">{subtitle}</p>}
      {trendLabel && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendClass}`}>
          {trendIcon}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

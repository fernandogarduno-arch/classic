import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, subtitle, trend, trendLabel, icon: Icon, alert = false }) {
  const trendPositive = trend > 0
  const trendNeutral  = trend === 0 || trend === undefined

  return (
    <div className={`kpi-card relative overflow-hidden ${alert ? 'ring-1 ring-red-200' : ''}`}>
      {alert && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-500" />}

      <div className="flex items-start justify-between mb-3">
        <p className="label-caps">{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: alert ? '#FEE2E2' : '#EBF2E9' }}>
            <Icon size={15} strokeWidth={1.75}
              style={{ color: alert ? '#991B1B' : '#3E6335' }} />
          </div>
        )}
      </div>

      <p className="font-display leading-none mb-1.5" style={{ fontSize: 34, color: '#111827' }}>
        {value}
      </p>

      {subtitle && (
        <p className="text-xs" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      )}

      {trendLabel && (
        <div className="flex items-center gap-1 mt-2.5 pt-2.5"
          style={{ borderTop: '1px solid #F0F4F1' }}>
          {trendNeutral
            ? <Minus size={11} style={{ color: '#9CA3AF' }} />
            : trendPositive
              ? <TrendingUp size={11} style={{ color: '#166534' }} />
              : <TrendingDown size={11} style={{ color: '#991B1B' }} />
          }
          <span className="text-xs font-medium"
            style={{ color: trendNeutral ? '#9CA3AF' : trendPositive ? '#166534' : '#991B1B' }}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  )
}

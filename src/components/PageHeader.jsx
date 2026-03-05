export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <h1 className="font-display leading-none" style={{ fontSize: 36, color: '#111827', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm" style={{ color: '#9CA3AF' }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}

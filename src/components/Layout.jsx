import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, CalendarDays, UserCheck,
  Banknote, Megaphone, TrendingUp, CreditCard,
  ShieldCheck, LogOut, Menu, Bell, ChevronDown
} from 'lucide-react'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',     end: true },
  { to: '/clientes',     icon: Users,           label: 'Clientes' },
  { to: '/agenda',       icon: CalendarDays,    label: 'Agenda' },
  { to: '/instructoras', icon: UserCheck,       label: 'Instructoras' },
  { to: '/nomina',       icon: Banknote,        label: 'Nómina' },
  { to: '/pagos',        icon: CreditCard,      label: 'Pagos' },
  { to: '/marketing',    icon: Megaphone,       label: 'Marketing' },
  { to: '/finanzas',     icon: TrendingUp,      label: 'Finanzas' },
  { to: '/cumplimiento', icon: ShieldCheck,     label: 'Cumplimiento' },
]

export default function Layout() {
  const { perfil, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#4A6741' }}>
          <span className="font-display text-white text-base font-bold">C</span>
        </div>
        <div>
          <p className="font-display text-base leading-none" style={{ color: '#E8EDE9' }}>Classic Studio</p>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: '#6B7B72' }}>Admin Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#4A6741' }}>
            <span className="text-xs font-semibold text-white">
              {perfil?.nombre?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#E8EDE9' }}>{perfil?.nombre ?? 'Admin'}</p>
            <p className="text-[10px] capitalize" style={{ color: '#6B7B72' }}>{perfil?.rol ?? 'admin'}</p>
          </div>
          <button onClick={handleSignOut}
            className="transition-colors"
            style={{ color: '#6B7B72' }}
            onMouseEnter={e => e.currentTarget.style.color = '#B85C6E'}
            onMouseLeave={e => e.currentTarget.style.color = '#6B7B72'}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F2F4F3' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-56 xl:w-60 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative z-50 w-60 h-full">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white flex items-center px-4 lg:px-6 gap-4 shrink-0"
          style={{ borderBottom: '1px solid #DDE3DE' }}>
          <button className="lg:hidden text-cs-muted" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button className="relative text-cs-muted hover:text-cs-charcoal transition-colors">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-medium"
              style={{ backgroundColor: '#B85C6E' }}>3</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-medium text-cs-charcoal cursor-pointer">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: '#4A6741' }}>
              {perfil?.nombre?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span>{perfil?.nombre ?? 'Admin'}</span>
            <ChevronDown size={14} className="text-cs-muted" />
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, CalendarDays, UserCheck,
  Banknote, Megaphone, TrendingUp, CreditCard,
  ShieldCheck, LogOut, Menu, X, Bell, ChevronDown
} from 'lucide-react'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/clientes',      icon: Users,           label: 'Clientes' },
  { to: '/agenda',        icon: CalendarDays,    label: 'Agenda' },
  { to: '/instructoras',  icon: UserCheck,       label: 'Instructoras' },
  { to: '/nomina',        icon: Banknote,        label: 'Nómina' },
  { to: '/pagos',         icon: CreditCard,      label: 'Pagos' },
  { to: '/marketing',     icon: Megaphone,       label: 'Marketing' },
  { to: '/finanzas',      icon: TrendingUp,      label: 'Finanzas' },
  { to: '/cumplimiento',  icon: ShieldCheck,     label: 'Cumplimiento' },
]

export default function Layout() {
  const { perfil, signOut } = useAuth()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-cs-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-cs-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cs-charcoal flex items-center justify-center">
          <span className="font-display text-cs-gold text-base font-bold">C</span>
        </div>
        <div>
          <p className="font-display text-cs-charcoal text-base leading-none">Classic Studio</p>
          <p className="text-[10px] text-cs-muted leading-none mt-0.5">Admin Platform</p>
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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-cs-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-cs-gold/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-cs-gold">
              {perfil?.nombre?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-cs-charcoal truncate">{perfil?.nombre ?? 'Admin'}</p>
            <p className="text-[10px] text-cs-muted capitalize">{perfil?.rol ?? 'admin'}</p>
          </div>
          <button onClick={handleSignOut} className="text-cs-muted hover:text-cs-rose transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-cs-cream">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-56 xl:w-60 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative z-50 w-60 h-full">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-cs-border flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button className="lg:hidden text-cs-muted" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button className="relative text-cs-muted hover:text-cs-charcoal">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cs-rose text-white text-[9px] rounded-full flex items-center justify-center font-medium">3</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-cs-charcoal font-medium cursor-pointer">
            <span>{perfil?.nombre ?? 'Admin'}</span>
            <ChevronDown size={14} className="text-cs-muted" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

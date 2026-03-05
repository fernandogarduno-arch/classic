import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, CalendarDays, UserCheck,
  Banknote, Megaphone, TrendingUp, CreditCard,
  ShieldCheck, LogOut, Menu, Bell, ChevronDown
} from 'lucide-react'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/clientes',     icon: Users,           label: 'Clientes' },
  { to: '/agenda',       icon: CalendarDays,    label: 'Agenda' },
  { to: '/instructoras', icon: UserCheck,       label: 'Instructoras' },
  { to: '/nomina',       icon: Banknote,        label: 'Nómina' },
  { to: '/pagos',        icon: CreditCard,      label: 'Pagos' },
  { to: '/marketing',    icon: Megaphone,       label: 'Marketing' },
  { to: '/finanzas',     icon: TrendingUp,      label: 'Finanzas' },
  { to: '/cumplimiento', icon: ShieldCheck,     label: 'Cumplimiento' },
]

const SECTION_DIVIDERS = { 4: 'OPERACIONES', 7: 'REPORTES' }

export default function Layout() {
  const { perfil, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#15172B' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #4F7C44, #3E6335)' }}>
          <span className="font-display text-white font-bold" style={{ fontSize: 16 }}>C</span>
        </div>
        <div>
          <p className="font-display leading-none font-semibold" style={{ color: '#E2E8DF', fontSize: 15 }}>Classic Studio</p>
          <p style={{ color: 'rgba(226,232,223,0.35)', fontSize: 10, marginTop: 2 }}>Admin Platform</p>
        </div>
      </div>

      <div className="mx-4 mb-3" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, end }, i) => (
          <div key={to}>
            {SECTION_DIVIDERS[i] && (
              <p className="px-3 pt-4 pb-1.5 label-caps" style={{ color: 'rgba(226,232,223,0.25)', fontSize: 9 }}>
                {SECTION_DIVIDERS[i]}
              </p>
            )}
            <NavLink
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="mx-4 mt-2 mb-1" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #4F7C44, #3E6335)' }}>
            {perfil?.nombre?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'rgba(226,232,223,0.85)' }}>
              {perfil?.nombre ?? 'Admin'}
            </p>
            <p style={{ color: 'rgba(226,232,223,0.35)', fontSize: 10, textTransform: 'capitalize' }}>
              {perfil?.rol ?? 'admin'}
            </p>
          </div>
          <button onClick={handleSignOut}
            style={{ color: 'rgba(226,232,223,0.3)' }}
            className="hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5">
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F5F7F5' }}>
      <aside className="hidden lg:flex lg:w-56 xl:w-64 shrink-0 flex-col">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative z-50 w-56 h-full"><Sidebar /></aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white flex items-center px-5 gap-4 shrink-0"
          style={{ borderBottom: '1px solid #E2E8E2' }}>
          <button className="lg:hidden text-cs-muted" onClick={() => setOpen(true)}>
            <Menu size={19} />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-cs-surface-2 transition-colors" style={{ color: '#9CA3AF' }}>
            <Bell size={17} strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#B34C60' }} />
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: '#E2E8E2' }} />
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #4F7C44, #3E6335)' }}>
              {perfil?.nombre?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm font-medium" style={{ color: '#1C2A22' }}>
              {perfil?.nombre ?? 'Admin'}
            </span>
            <ChevronDown size={13} style={{ color: '#9CA3AF' }} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

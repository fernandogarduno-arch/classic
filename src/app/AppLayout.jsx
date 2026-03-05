import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAppAuth } from './useAppAuth'
import { Home, Calendar, BookOpen, User } from 'lucide-react'
import '../app/appStyles.css'

const NAV = [
  { to: '/app',          icon: Home,      label: 'Inicio',   end: true },
  { to: '/app/reservar', icon: Calendar,  label: 'Reservar' },
  { to: '/app/clases',   icon: BookOpen,  label: 'Mis Clases' },
  { to: '/app/perfil',   icon: User,      label: 'Perfil' },
]

export default function AppLayout() {
  return (
    <div className="app-shell">
      <main style={{ minHeight: '100dvh' }}>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={21} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AppAuthProvider, useAppAuth } from './app/useAppAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Agenda from './pages/Agenda'
import Instructoras from './pages/Instructoras'
import Nomina from './pages/Nomina'
import Marketing from './pages/Marketing'
import Finanzas from './pages/Finanzas'
import Cumplimiento from './pages/Cumplimiento'
import Pagos from './pages/Pagos'

import AppLayout from './app/AppLayout'
import AppLogin from './app/AppLogin'
import AppHome from './app/AppHome'
import AppReservar from './app/AppReservar'
import AppMisClases from './app/AppMisClases'
import AppPerfil from './app/AppPerfil'

/* ── Admin guard ───────────────────────────── */
function AdminRoute({ children }) {
  const { session } = useAuth()
  if (session === undefined) return (
    <div className="h-screen flex items-center justify-center bg-cs-surface-2">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cs-olive border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-cs-muted">Cargando Classic Studio…</p>
      </div>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

/* ── App guard ─────────────────────────────── */
function AppRoute({ children }) {
  const { session } = useAppAuth()
  if (session === undefined) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF9' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #3E6335',
        borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!session) return <Navigate to="/app/login" replace />
  return children
}

function AdminRoutes() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<AdminRoute><Layout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clientes"     element={<Clientes />} />
        <Route path="agenda"       element={<Agenda />} />
        <Route path="instructoras" element={<Instructoras />} />
        <Route path="nomina"       element={<Nomina />} />
        <Route path="marketing"    element={<Marketing />} />
        <Route path="finanzas"     element={<Finanzas />} />
        <Route path="pagos"        element={<Pagos />} />
        <Route path="cumplimiento" element={<Cumplimiento />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ClienteAppRoutes() {
  return (
    <Routes>
      <Route path="/app/login" element={<AppLogin />} />
      <Route path="/app" element={<AppRoute><AppLayout /></AppRoute>}>
        <Route index element={<AppHome />} />
        <Route path="reservar" element={<AppReservar />} />
        <Route path="clases"   element={<AppMisClases />} />
        <Route path="perfil"   element={<AppPerfil />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppAuthProvider>
        <Routes>
          {/* App para clientas — rutas /app/* */}
          <Route path="/app/*" element={<ClienteAppRoutes />} />
          {/* Admin — todo lo demás */}
          <Route path="/*" element={<AdminRoutes />} />
        </Routes>
      </AppAuthProvider>
    </AuthProvider>
  )
}

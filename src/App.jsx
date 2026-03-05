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
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7F5' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#3E6335', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

/* ── App guard ─────────────────────────────── */
function AppRoute({ children }) {
  const { session } = useAppAuth()
  if (session === undefined) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#FAFAF9' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%',
        border: '2.5px solid #3E6335', borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!session) return <Navigate to="/app/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AppAuthProvider>
        <Routes>

          {/* ── Webapp para usuarias (/app/*) ── */}
          <Route path="/app/login" element={<AppLogin />} />
          <Route path="/app" element={<AppRoute><AppLayout /></AppRoute>}>
            <Route index          element={<AppHome />} />
            <Route path="reservar" element={<AppReservar />} />
            <Route path="clases"   element={<AppMisClases />} />
            <Route path="perfil"   element={<AppPerfil />} />
          </Route>

          {/* ── Admin backoffice (todo lo demás) ── */}
          <Route path="/login" element={<AdminLoginGate />} />
          <Route path="/" element={<AdminRoute><Layout /></AdminRoute>}>
            <Route index           element={<Dashboard />} />
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
      </AppAuthProvider>
    </AuthProvider>
  )
}

function AdminLoginGate() {
  const { session } = useAuth()
  return session ? <Navigate to="/" replace /> : <Login />
}

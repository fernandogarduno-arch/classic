import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
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

function ProtectedRoute({ children }) {
  const { session } = useAuth()
  if (session === undefined) return (
    <div className="h-screen flex items-center justify-center bg-cs-surface-2">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cs-olive border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-cs-muted font-body">Cargando Classic Studio…</p>
      </div>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="instructoras" element={<Instructoras />} />
        <Route path="nomina" element={<Nomina />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="finanzas" element={<Finanzas />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="cumplimiento" element={<Cumplimiento />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

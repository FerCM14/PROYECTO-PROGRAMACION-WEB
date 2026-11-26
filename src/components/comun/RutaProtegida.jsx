import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/cuentas/AuthContext'

export default function RutaProtegida({ roles, children }) {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!roles.includes(usuario.rol)) return <Navigate to="/403" replace />

  return children ?? <Outlet />
}
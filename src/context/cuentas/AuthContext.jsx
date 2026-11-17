/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import * as cuentas from '../../data/cuentas'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(cuentas.obtenerSesion)

  function iniciarSesion(correo, contrasena) {
    const resultado = cuentas.iniciarSesion(correo, contrasena)
    if (resultado.ok) setUsuario(cuentas.obtenerSesion())
    return resultado
  }

  function cerrarSesion() {
    cuentas.cerrarSesion()
    setUsuario(null)
  }

  return <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
    {children}
  </AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import * as datos from '../../data/cuentas'
import { useActualizacion } from '../DatosContext'

const CuentasContext = createContext(null)

export function CuentasProvider({ children }) {
  const version = useActualizacion()
  const [cambios, setCambios] = useState(0)

  function obtenerCuentas(...argumentos) {
    const resultado = datos.obtenerCuentas(...argumentos)
    return resultado
  }

  function obtenerCuenta(...argumentos) {
    const resultado = datos.obtenerCuenta(...argumentos)
    return resultado
  }

  function existeCuenta(...argumentos) {
    const resultado = datos.existeCuenta(...argumentos)
    return resultado
  }

  function registrarCuenta(...argumentos) {
    const resultado = datos.registrarCuenta(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function asignarDeuda(...argumentos) {
    const resultado = datos.asignarDeuda(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function bloquearCuenta(...argumentos) {
    const resultado = datos.bloquearCuenta(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function desbloquearCuenta(...argumentos) {
    const resultado = datos.desbloquearCuenta(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function actualizarContrasena(...argumentos) {
    const resultado = datos.actualizarContrasena(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function cambiarContrasena(...argumentos) {
    const resultado = datos.cambiarContrasena(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function actualizarPerfil(...argumentos) {
    const resultado = datos.actualizarPerfil(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function iniciarSesion(...argumentos) {
    const resultado = datos.iniciarSesion(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function obtenerSesion(...argumentos) {
    const resultado = datos.obtenerSesion(...argumentos)
    return resultado
  }

  function cerrarSesion(...argumentos) {
    const resultado = datos.cerrarSesion(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  return <CuentasContext.Provider value={{ version: version + cambios, obtenerCuentas, obtenerCuenta, existeCuenta, registrarCuenta, asignarDeuda, bloquearCuenta, desbloquearCuenta, actualizarContrasena, cambiarContrasena, actualizarPerfil, iniciarSesion, obtenerSesion, cerrarSesion }}>
    {children}
  </CuentasContext.Provider>
}

export const useCuentas = () => useContext(CuentasContext)

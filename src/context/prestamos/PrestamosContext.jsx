/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import * as datos from '../../data/Identificacion'
import { useActualizacion } from '../DatosContext'

const PrestamosContext = createContext(null)

export function PrestamosProvider({ children }) {
  const version = useActualizacion()
  const [cambios, setCambios] = useState(0)

  function obtenerPrestamos(...argumentos) {
    const resultado = datos.obtenerPrestamos(...argumentos)
    return resultado
  }

  function obtenerPrestamo(...argumentos) {
    const resultado = datos.obtenerPrestamo(...argumentos)
    return resultado
  }

  function obtenerPrestamoDeSolicitud(...argumentos) {
    const resultado = datos.obtenerPrestamoDeSolicitud(...argumentos)
    return resultado
  }

  function crearPrestamo(...argumentos) {
    const resultado = datos.crearPrestamo(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function registrarEntrega(...argumentos) {
    const resultado = datos.registrarEntrega(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function renovarPrestamo(...argumentos) {
    const resultado = datos.renovarPrestamo(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function registrarDevolucion(...argumentos) {
    const resultado = datos.registrarDevolucion(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  return <PrestamosContext.Provider value={{ version: version + cambios, obtenerPrestamos, obtenerPrestamo, obtenerPrestamoDeSolicitud, crearPrestamo, registrarEntrega, renovarPrestamo, registrarDevolucion }}>
    {children}
  </PrestamosContext.Provider>
}

export const usePrestamos = () => useContext(PrestamosContext)

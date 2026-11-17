/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import * as datos from '../../data/Reservas'
import { useActualizacion } from '../DatosContext'

const ReservasContext = createContext(null)

export function ReservasProvider({ children }) {
  const version = useActualizacion()
  const [cambios, setCambios] = useState(0)

  function hoyISO(...argumentos) {
    const resultado = datos.hoyISO(...argumentos)
    return resultado
  }

  function obtenerTodasLasReservas(...argumentos) {
    const resultado = datos.obtenerTodasLasReservas(...argumentos)
    return resultado
  }

  function obtenerReservas(...argumentos) {
    const resultado = datos.obtenerReservas(...argumentos)
    return resultado
  }

  function registrarReserva(...argumentos) {
    const resultado = datos.registrarReserva(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function cancelarReserva(...argumentos) {
    const resultado = datos.cancelarReserva(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function calcularEstados(...argumentos) {
    const resultado = datos.calcularEstados(...argumentos)
    return resultado
  }

  return <ReservasContext.Provider value={{ version: version + cambios, hoyISO, obtenerTodasLasReservas, obtenerReservas, registrarReserva, cancelarReserva, calcularEstados }}>
    {children}
  </ReservasContext.Provider>
}

export const useReservas = () => useContext(ReservasContext)

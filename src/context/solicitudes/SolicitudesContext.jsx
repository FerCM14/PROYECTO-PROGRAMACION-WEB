/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import * as datos from '../../data/Solicitudes'
import { useActualizacion } from '../DatosContext'

const SolicitudesContext = createContext(null)

export function SolicitudesProvider({ children }) {
  const version = useActualizacion()
  const [cambios, setCambios] = useState(0)

  function obtenerTodasLasSolicitudes(...argumentos) {
    const resultado = datos.obtenerTodasLasSolicitudes(...argumentos)
    return resultado
  }

  function obtenerSolicitudes(...argumentos) {
    const resultado = datos.obtenerSolicitudes(...argumentos)
    return resultado
  }

  function registrarSolicitud(...argumentos) {
    const resultado = datos.registrarSolicitud(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function retirarSolicitud(...argumentos) {
    const resultado = datos.retirarSolicitud(...argumentos)
    setCambios((actual) => actual + 1)
    return resultado
  }

  function ultimaSolicitudProducto(...argumentos) {
    const resultado = datos.ultimaSolicitudProducto(...argumentos)
    return resultado
  }

  return <SolicitudesContext.Provider value={{ version: version + cambios, obtenerTodasLasSolicitudes, obtenerSolicitudes, registrarSolicitud, retirarSolicitud, ultimaSolicitudProducto, crearSolicitud: datos.crearSolicitud }}>
    {children}
  </SolicitudesContext.Provider>
}

export const useSolicitudes = () => useContext(SolicitudesContext)

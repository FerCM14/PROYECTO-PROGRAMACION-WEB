/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import * as datos from '../../data/Producto'
import { cambiarEstadoUnidadManual as guardarEstadoManual } from '../../data/EstadoUnidad'
import { useActualizacion } from '../DatosContext'

const CatalogoContext = createContext(null)

export function CatalogoProvider({ children }) {
  const version = useActualizacion()
  const [cambios, setCambios] = useState(0)

  function obtenerCategoria(...argumentos) {
    const resultado = datos.obtenerCategoria(...argumentos)
    return resultado
  }

  function contarPorCategoria(...argumentos) {
    const resultado = datos.contarPorCategoria(...argumentos)
    return resultado
  }

  function obtenerProducto(...argumentos) {
    const resultado = datos.obtenerProducto(...argumentos)
    return resultado
  }

  function agregarProducto(...argumentos) {
    const resultado = datos.agregarProducto(...argumentos)
    if (resultado.ok) setCambios((actual) => actual + 1)
    return resultado
  }

  function actualizarProducto(...argumentos) {
    const resultado = datos.actualizarProducto(...argumentos)
    if (resultado.ok) setCambios((actual) => actual + 1)
    return resultado
  }

  function eliminarProducto(id) {
    const resultado = datos.eliminarProducto(id)
    if (resultado.ok) setCambios((actual) => actual + 1)
    return resultado
  }

  function cambiarEstadoUnidad(...argumentos) {
    const resultado = datos.cambiarEstadoUnidad(...argumentos)
    if (resultado.ok) setCambios((actual) => actual + 1)
    return resultado
  }

  function cambiarEstadoUnidadManual(...argumentos) {
    const resultado = guardarEstadoManual(...argumentos)
    if (resultado.ok) setCambios((actual) => actual + 1)
    return resultado
  }

  function registrarUnidadProducto(...argumentos) {
    const resultado = datos.registrarUnidadProducto(...argumentos)
    if (resultado.ok) setCambios((actual) => actual + 1)
    return resultado
  }

  return <CatalogoContext.Provider value={{ version: version + cambios, obtenerCategoria, contarPorCategoria, obtenerProducto, existeEquipo: datos.existeEquipo, agregarProducto, actualizarProducto, eliminarProducto, cambiarEstadoUnidad, cambiarEstadoUnidadManual, registrarUnidadProducto, CATEGORIAS: datos.CATEGORIAS, PRODUCTOS: datos.PRODUCTOS, RECOJO: datos.RECOJO }}>
    {children}
  </CatalogoContext.Provider>
}

export const useCatalogo = () => useContext(CatalogoContext)

import { PRODUCTOS, cambiarEstadoUnidad, obtenerProducto } from './Producto.js'
import { obtenerPrestamos } from './Identificacion.js'

export function consultarPrestamosUnidad(codigo) {
  const almacenados = JSON.parse(localStorage.getItem('prestamos')) ?? []
  if (!Array.isArray(almacenados)) throw new Error('Préstamos no disponibles')
  return obtenerPrestamos().filter((p) =>
    p?.unidad === codigo && ['Pendiente de entrega', 'Entregado'].includes(p.estado)
  )
}

export function errorTransicionManual(actual, nuevo) {
  if (!['Disponible', 'Mantenimiento', 'De baja'].includes(nuevo)) return 'Selecciona un estado manual válido.'
  if (actual === 'Prestada') return 'Registra la devolución antes de cambiar el estado de una unidad prestada.'
  if (actual === 'De baja') return 'La baja de esta unidad es definitiva.'
  if (!['Disponible', 'Mantenimiento'].includes(actual)) return 'No se puede cambiar el estado actual de esta unidad.'
  if (actual === nuevo) return 'Selecciona un estado diferente al actual.'
  return ''
}

export function cambiarEstadoUnidadManual(codigo, estado, motivo) {
  const unidad = PRODUCTOS.map((p) => obtenerProducto(p.id)).flatMap((p) => p.unidades).find((u) => u.codigo === codigo)
  if (!unidad) return { ok: false, mensaje: 'No se encontró la unidad en el inventario.' }

  const mensaje = errorTransicionManual(unidad.estado, estado)
  if (mensaje) return { ok: false, mensaje }

  try {
    if (consultarPrestamosUnidad(codigo).length) {
      return { ok: false, mensaje: 'La unidad tiene un préstamo comprometido. Resuélvelo antes de cambiar su estado.' }
    }
  } catch {
    return { ok: false, mensaje: 'No se pudieron verificar los préstamos de esta unidad.' }
  }

  const nota = (motivo ?? '').trim()
  if (!nota && (estado === 'Mantenimiento' || estado === 'De baja' || motivo)) {
    return { ok: false, campo: 'motivo', mensaje: 'Ingresa un motivo para el cambio de estado.' }
  }

  const resultado = cambiarEstadoUnidad(codigo, estado, nota)
  return resultado.ok ? resultado : { ok: false, mensaje: 'No se pudo guardar el estado en este navegador.' }
}

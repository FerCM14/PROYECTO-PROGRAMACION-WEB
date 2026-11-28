import { obtenerPrestamos } from './Identificacion.js'
import { formatearFecha, hoyISO, sumarDias } from './fechas.js'

export function unidadesActivas(producto) {
  return (producto?.unidades || []).filter((unidad) => unidad.estado !== 'De baja')
}

export function prestamosComprometidos(producto) {
  const codigos = new Set((producto?.unidades || []).map((unidad) => unidad.codigo))
  return obtenerPrestamos().filter((p) => p &&
    ['Pendiente de entrega', 'Entregado'].includes(p.estado) &&
    (Number(p.productoId) === producto?.id || codigos.has(p.unidad))
  )
}

function fechaValida(fecha) {
  return formatearFecha(fecha) !== '—'
}

function ocupaFecha(prestamo, fecha, hoy) {
  if (prestamo.estado === 'Entregado') {
    return !fechaValida(prestamo.hasta) || prestamo.hasta < hoy || fecha <= prestamo.hasta
  }
  if (!fechaValida(prestamo.desde) || !fechaValida(prestamo.hasta) || prestamo.hasta < prestamo.desde) return true
  return prestamo.desde <= fecha && (prestamo.hasta < hoy || fecha <= prestamo.hasta)
}

export function capacidadEquipoEnFecha(producto, prestamos, fecha, hoy, unidadExcluida) {
  const ocupados = prestamos.filter((prestamo) => ocupaFecha(prestamo, fecha, hoy))
  const elegibles = unidadesActivas(producto).filter((unidad) => {
    if (unidad.codigo === unidadExcluida || ocupados.some((p) => p.unidad === unidad.codigo)) return false
    if (unidad.estado === 'Disponible') return true
    return unidad.estado === 'Prestada' && prestamos.some((p) => p.unidad === unidad.codigo && p.estado === 'Entregado')
  })
  return Math.max(0, elegibles.length - ocupados.filter((p) => !p.unidad).length)
}

export function disponibilidadEquipo(producto, hoy = hoyISO()) {
  const activas = unidadesActivas(producto)
  const prestamos = prestamosComprometidos(producto)
  return { activas, libres: capacidadEquipoEnFecha(producto, prestamos, hoy, hoy) }
}

export function proximaDevolucionEquipo(producto, hoy = hoyISO()) {
  const codigos = unidadesActivas(producto).filter((u) => u.estado === 'Prestada').map((u) => u.codigo)
  return prestamosComprometidos(producto)
    .filter((p) => p.estado === 'Entregado' && codigos.includes(p.unidad))
    .map((p) => p.hasta)
    .filter((fecha) => fechaValida(fecha) && fecha >= hoy)
    .sort()[0]
}

export function hayCupoEquipo(producto, prestamos, confirmadas, desde, hasta, hoy, unidadExcluida) {
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta || hasta < hoy) return false
  const inicio = desde < hoy ? hoy : desde
  const cambios = [...prestamos.flatMap((p) => [
    p.desde,
    fechaValida(p.hasta) ? sumarDias(p.hasta, 1) : ''
  ]), ...confirmadas.map((r) => r.desde)]
  const fechas = new Set([inicio, ...cambios.filter((f) => fechaValida(f) && f >= inicio && f <= hasta)])
  const conCapacidad = [...fechas].every((fecha) => {
    const ocupadas = confirmadas.filter((r) => r.desde <= fecha && r.hasta >= fecha).length
    return capacidadEquipoEnFecha(producto, prestamos, fecha, hoy, unidadExcluida) > ocupadas
  })
  if (!conCapacidad) return false

  // Tener una unidad libre cada día no basta si ninguna cubre todo el intervalo.
  const asignados = prestamos.filter((p) => p.unidad)
  return unidadesActivas(producto).some((unidad) =>
    [...fechas].every((fecha) =>
      capacidadEquipoEnFecha({ unidades: [unidad] }, asignados, fecha, hoy, unidadExcluida) > 0
    )
  )
}

import { PRODUCTOS, cambiarEstadoUnidad, obtenerProducto } from './Producto.js'
import { obtenerPrestamos } from './Identificacion.js'
import { calcularEstados, hoyISO } from './Reservas.js'

function leerLista(clave) {
  const datos = JSON.parse(localStorage.getItem(clave)) ?? []
  if (!Array.isArray(datos)) throw new Error('Registros no disponibles')
  return datos
}

export function consultarPrestamosUnidad(codigo) {
  leerLista('prestamos')
  return obtenerPrestamos().filter((p) =>
    p?.unidad === codigo && ['Pendiente de entrega', 'Entregado'].includes(p.estado)
  )
}

export function consultarReservasUnidad(producto, unidad, hoy = hoyISO()) {
  const actuales = leerLista('reservas')
  // El lector habitual migra el calendario. Aquí solo se consultan los registros.
  const anteriores = leerLista('calendario-reservas')
    .filter((r) => r?.tipo === 'Reservada' && !actuales.some((actual) => actual?.id === r.id))
    .map((r) => ({ ...r, productoId: r.equipoId, desde: r.inicio, hasta: r.fin, creadaEn: Number(r.id) || 0 }))
  const activas = [...actuales, ...anteriores]
    .filter((r) => r && !r.cancelada && r.desde && r.hasta >= hoy && r.desde <= r.hasta)
    .sort((a, b) => (a.creadaEn || 0) - (b.creadaEn || 0))
  const directas = activas.filter((r) => r.unidad === unidad.codigo)

  const delModelo = activas.filter((r) => Number(r.productoId) === producto.id)
  const conCupo = calcularEstados(delModelo, hoy)
  const trasRetiro = calcularEstados(delModelo, hoy, unidad.codigo)
  const porModelo = delModelo.filter((r) =>
    !r.unidad && conCupo[r.id]?.estado === 'Confirmada' && trasRetiro[r.id]?.estado !== 'Confirmada'
  )
  return { directas, porModelo }
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
  let producto
  try {
    producto = PRODUCTOS.map((p) => obtenerProducto(p.id)).find((p) => p.unidades.some((u) => u.codigo === codigo))
  } catch {
    return { ok: false, mensaje: 'No se pudo consultar la unidad en este navegador.' }
  }
  const unidad = producto?.unidades.find((u) => u.codigo === codigo)
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

  if (estado !== 'Disponible') {
    try {
      const reservas = consultarReservasUnidad(producto, unidad)
      if (reservas.directas.length || reservas.porModelo.length) {
        return { ok: false, mensaje: 'El cambio dejaría una reserva sin la unidad o el cupo necesario.' }
      }
    } catch {
      return { ok: false, mensaje: 'No se pudieron verificar las reservas de este equipo.' }
    }
  }

  const nota = (motivo ?? '').trim()
  if (!nota && (estado === 'Mantenimiento' || estado === 'De baja' || motivo)) {
    return { ok: false, campo: 'motivo', mensaje: 'Ingresa un motivo para el cambio de estado.' }
  }

  const resultado = cambiarEstadoUnidad(codigo, estado, nota)
  return resultado.ok ? resultado : { ok: false, mensaje: 'No se pudo guardar el estado en este navegador.' }
}

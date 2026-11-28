import { obtenerProducto } from './Producto.js'
import { calcularEstados, obtenerTodasLasReservas } from './Reservas.js'
import { hayCupoEquipo, prestamosComprometidos } from './CupoEquipo.js'

const DIA_MS = 24 * 60 * 60 * 1000

function aFecha(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function aISO(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function hoyISO() {
  return aISO(new Date())
}

export function sumarDias(iso, dias) {
  const fecha = aFecha(iso)
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

// devolución - inicio
export function diferenciaDias(desde, hasta) {
  return Math.round((aFecha(hasta) - aFecha(desde)) / DIA_MS)
}

export function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

export function formatearCorto(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

export function consultarCupoSolicitud(idProducto, hoy = hoyISO()) {
  try {
    for (const clave of ['prestamos', 'reservas', 'calendario-reservas']) {
      if (!Array.isArray(JSON.parse(localStorage.getItem(clave)) ?? [])) return () => false
    }
    const producto = obtenerProducto(idProducto)
    if (!producto) return () => false
    const prestamos = prestamosComprometidos(producto)
    const reservas = obtenerTodasLasReservas({ migrar: false }).filter((r) => Number(r.productoId) === producto.id)
    const estados = calcularEstados(reservas, hoy)
    const confirmadas = reservas.filter((r) => estados[r.id]?.estado === 'Confirmada')
    return (desde, hasta) => hayCupoEquipo(producto, prestamos, confirmadas, desde, hasta, hoy)
  } catch {
    return () => false
  }
}

export function proximoRangoConCupo(hayCupo, desde, dias = 5) {
  let candidato = desde

  for (let i = 0; i < 60; i += 1) {
    const fin = sumarDias(candidato, dias)
    if (hayCupo(candidato, fin)) return { inicio: candidato, fin }
    candidato = sumarDias(candidato, 1)
  }

  return null
}

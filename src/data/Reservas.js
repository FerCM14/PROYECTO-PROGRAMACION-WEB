// src/data/Reservas.js
// Registro de reservas anticipadas (el mismo que alimenta el calendario de
// ocupación). Se guarda en localStorage.
//
// El ESTADO no se guarda: se calcula en base a la disponibilidad del producto
// (PRODUCTOS[].total) y a las reservas que se cruzan en fechas.
//   - Cumplida   -> la fecha "hasta" ya pasó
//   - Confirmada -> hay una unidad libre en el rango
//   - En espera  -> no hay unidades libres; entra a la cola del producto
// Si alguien cancela, la cola avanza sola porque todo se recalcula.

import { PRODUCTOS } from './Producto' // <- ajusta la ruta/nombre a tu archivo de productos

const CLAVE = 'reservas'

/* ---------- Utilidades de fecha (AAAA-MM-DD) ---------- */

export function hoyISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/* ---------- Lectura y escritura ---------- */

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    const lista = Array.isArray(datos) ? datos : []
    const antiguas = JSON.parse(localStorage.getItem('calendario-reservas') || '[]')
    const migradas = (Array.isArray(antiguas) ? antiguas : [])
      .filter((r) => r.tipo === 'Reservada' && !lista.some((actual) => actual.id === r.id))
      .map((r) => ({ id:r.id, correo:r.correo, productoId:r.equipoId, desde:r.inicio, hasta:r.fin, creadaEn:Number(r.id) || 0, cancelada:false }))
    if (migradas.length) localStorage.setItem(CLAVE, JSON.stringify([...lista, ...migradas]))
    return [...lista, ...migradas]
  } catch { return [] }
}

function guardar(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
    window.dispatchEvent(new Event('storage'))
  } catch (err) {
    console.error('Error guardando reservas:', err)
  }
}

export function obtenerTodasLasReservas() {
  return leer().filter((r) => !r.cancelada)
}

export function obtenerReservas(correo) {
  const buscado = String(correo || '').trim().toLowerCase()
  return obtenerTodasLasReservas().filter(
    (r) => String(r.correo || '').trim().toLowerCase() === buscado
  )
}

// Registra una reserva nueva (la usa el calendario / "Nueva reserva")
export function registrarReserva({ correo, productoId, desde, hasta }) {
  const todas = leer()
  const numeros = todas.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10) || 0)
  const reserva = {
    id: `RES-${String(Math.max(0, ...numeros) + 1).padStart(3, '0')}`,
    correo,
    productoId: Number(productoId),
    desde,
    hasta,
    creadaEn: Date.now(),
    cancelada: false
  }
  guardar([...todas, reserva])
  return { ok: true, reserva }
}

export function cancelarReserva(id) {
  const todas = leer()
  if (!todas.some((r) => r.id === id)) return { ok: false }
  guardar(todas.map((r) => (r.id === id ? { ...r, cancelada: true } : r)))
  return { ok: true }
}

/* ---------- Cálculo de estados y prioridad ---------- */

// Devuelve { [idReserva]: { estado, puesto?, totalEspera? } }
export function calcularEstados(reservas = obtenerTodasLasReservas(), hoy = hoyISO()) {
  const resultado = {}
  const porProducto = {}

  reservas.forEach((r) => {
    ;(porProducto[r.productoId] = porProducto[r.productoId] || []).push(r)
  })

  Object.entries(porProducto).forEach(([productoId, lista]) => {
    const producto = PRODUCTOS.find((p) => p.id === Number(productoId))
    const capacidad = producto ? producto.total : 0

    // Se atiende por orden de llegada
    const orden = [...lista].sort((a, b) => a.creadaEn - b.creadaEn)
    const confirmadas = []
    const espera = []

    orden.forEach((r) => {
      if (r.hasta < hoy) {
        resultado[r.id] = { estado: 'Cumplida' }
        return
      }
      const ocupadas = confirmadas.filter((c) => c.desde <= r.hasta && c.hasta >= r.desde).length
      if (ocupadas < capacidad) {
        confirmadas.push(r)
        resultado[r.id] = { estado: 'Confirmada' }
      } else {
        espera.push(r)
      }
    })

    espera.forEach((r, i) => {
      resultado[r.id] = { estado: 'En espera', puesto: i + 1, totalEspera: espera.length }
    })
  })

  return resultado
}
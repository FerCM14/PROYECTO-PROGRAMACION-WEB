// src/data/Solicitudes.js
// Datos de solicitudes guardados en localStorage.

const CLAVE = 'solicitudes'

function leerTodas() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

function guardarTodas(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista))
}

function generarCodigo(todas) {
  const numeros = todas.map((s) => parseInt(String(s.codigo).replace(/\D/g, ''), 10) || 0)
  const siguiente = Math.max(0, ...numeros) + 1
  return `SOL-${String(siguiente).padStart(4, '0')}`
}

// Todas las solicitudes (vista del encargado)
export function obtenerTodasLasSolicitudes() {
  return leerTodas()
}

// Solicitudes de un estudiante
export function obtenerSolicitudes(correo) {
  return leerTodas().filter((s) => s.correo === correo)
}

// Registra una solicitud nueva en estado "Enviada".
// Acepta registrarSolicitud(correo, datos) o registrarSolicitud({ correo, ...datos })
export function registrarSolicitud(primero, segundo) {
  const datos =
    typeof primero === 'string' ? { correo: primero, ...(segundo || {}) } : { ...(primero || {}) }

  const todas = leerTodas()
  const hoy = new Date().toISOString().slice(0, 10)

  const solicitud = {
    codigo: generarCodigo(todas),
    estado: 'Enviada',
    unidad: '',
    motivoRechazo: '',
    fecha: hoy,
    ...datos,
    productoId: datos.productoId ?? datos.equipoId ?? null,
    desde: datos.desde || datos.inicio || datos.fechaInicio || '',
    hasta: datos.hasta || datos.devolucion || datos.fechaDevolucion || ''
  }

  guardarTodas([...todas, solicitud])
  return { ok: true, solicitud }
}

// Alias por si alguna página usa este nombre
export const crearSolicitud = registrarSolicitud

// Solo se puede retirar una solicitud en estado "Enviada".
// Devuelve { ok: true } o { ok: false, motivo }
export function retirarSolicitud(correo, codigo) {
  const todas = leerTodas()
  const solicitud = todas.find((s) => s.codigo === codigo && s.correo === correo)

  if (!solicitud) {
    return { ok: false, motivo: 'no-encontrada' }
  }

  if (solicitud.estado !== 'Enviada') {
    return { ok: false, motivo: 'no-retirable' }
  }

  guardarTodas(todas.filter((s) => s !== solicitud))
  return { ok: true }
}
export function ultimaSolicitudProducto(producto) {
  return leerTodas().filter((s) => Number(s.productoId) === producto.id || s.equipo === producto.nombre || producto.unidades?.some((u) => u.codigo === s.unidad))
    .sort((a,b) => String(b.fecha || b.desde || b.inicio || '').localeCompare(String(a.fecha || a.desde || a.inicio || '')))[0] || null
}

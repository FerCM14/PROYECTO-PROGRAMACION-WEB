import { cambiarEstadoUnidad } from './Producto'
// src/data/Prestamos.js
// Préstamos guardados en localStorage. Se crean al aprobar una solicitud
// (modal "Aprobar solicitud") y se completan al registrar la entrega.
//
// Forma de un préstamo:
// {
//   codigo: 'PRE-2026-0001',
//   solicitud: 'SOL-0003',        // código de la solicitud aprobada
//   correo, productoId, equipo,   // estudiante y equipo
//   unidad: 'INV-OSC-0042',
//   desde: 'AAAA-MM-DD',          // fecha de entrega designada en la solicitud
//   hasta: 'AAAA-MM-DD',          // devolución pactada
//   estado: 'Pendiente de entrega' | 'Entregado' | 'Devuelto',
//   aprobadoEn: ISO,
//   entrega: null | { fechaEntrega, accesorios: [{ nombre, entregado }], observaciones },
//   devolucion: null | { fechaRetorno, estadoRetorno, accesoriosFaltantes, descripcion, fotos, diasRetraso, penalidad, registradoEn }
// }

const CLAVE = 'prestamos'
const CLAVE_SOLICITUDES = 'solicitudes'

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

function guardar(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista))
}

// PRE-AAAA-NNNN, correlativo sobre todos los préstamos
function generarCodigo(todos) {
  const anio = new Date().getFullYear()
  const numeros = todos.map((p) => parseInt(String(p.codigo).split('-').pop(), 10) || 0)
  const siguiente = Math.max(0, ...numeros) + 1
  return `PRE-${anio}-${String(siguiente).padStart(4, '0')}`
}

export function obtenerPrestamos() {
  return leer()
}

export function obtenerPrestamo(codigo) {
  return leer().find((p) => p.codigo === codigo) || null
}

export function obtenerPrestamoDeSolicitud(codigoSolicitud) {
  return leer().find((p) => p.solicitud === codigoSolicitud) || null
}

// Crea el préstamo de una solicitud aprobada. Si ya tenía uno, lo devuelve.
export function crearPrestamo({ solicitud, correo, productoId = null, equipo = '', unidad, desde, hasta }) {
  const todos = leer()
  const existente = todos.find((p) => p.solicitud === solicitud)

  if (existente) {
    return { ok: true, prestamo: existente, existente: true }
  }

  const prestamo = {
    codigo: generarCodigo(todos),
    solicitud,
    correo,
    productoId,
    equipo,
    unidad,
    desde,
    hasta,
    estado: 'Pendiente de entrega',
    aprobadoEn: new Date().toISOString(),
    entrega: null
  }

  guardar([...todos, prestamo])
  return { ok: true, prestamo }
}

// Registra la entrega: guarda accesorios, fecha y observaciones, y marca la solicitud como "Entregada"
export function registrarEntrega(codigo, { fechaEntrega, accesorios, observaciones = '' }) {
  const todos = leer()
  const indice = todos.findIndex((p) => p.codigo === codigo)

  if (indice === -1) {
    return { ok: false, motivo: 'no-encontrado' }
  }

  const prestamo = {
    ...todos[indice],
    estado: 'Entregado',
    entrega: { fechaEntrega, accesorios, observaciones: observaciones.trim() }
  }

  todos[indice] = prestamo
  guardar(todos)
  cambiarEstadoUnidad(prestamo.unidad, prestamo.estado === 'Entregado' ? 'Prestada' : 'Disponible')

  try {
    const solicitudes = JSON.parse(localStorage.getItem(CLAVE_SOLICITUDES)) || []
    localStorage.setItem(
      CLAVE_SOLICITUDES,
      JSON.stringify(
        solicitudes.map((s) => (s.codigo === prestamo.solicitud ? { ...s, estado: 'Entregada' } : s))
      )
    )
  } catch {
    /* sin acceso a localStorage */
  }

  return { ok: true, prestamo }
}

// Renovar: extiende la devolución pactada
export function renovarPrestamo(codigo, nuevaFecha) {
  const todos = leer()
  const indice = todos.findIndex((p) => p.codigo === codigo)

  if (indice === -1) {
    return { ok: false, motivo: 'no-encontrado' }
  }

  const prestamo = {
    ...todos[indice],
    hasta: nuevaFecha,
    renovaciones: (todos[indice].renovaciones || 0) + 1
  }

  todos[indice] = prestamo
  guardar(todos)
  return { ok: true, prestamo }
}

// Devolución: cierra el préstamo y marca la solicitud como "Devuelta"
export function registrarDevolucion(codigo, datos) {
  const todos = leer()
  const indice = todos.findIndex((p) => p.codigo === codigo)

  if (indice === -1) {
    return { ok: false, motivo: 'no-encontrado' }
  }

  const prestamo = {
    ...todos[indice],
    estado: 'Devuelto',
    devolucion: { ...datos, registradoEn: new Date().toISOString() }
  }

  todos[indice] = prestamo
  guardar(todos)
  cambiarEstadoUnidad(prestamo.unidad, prestamo.estado === 'Entregado' ? 'Prestada' : 'Disponible')

  try {
    const solicitudes = JSON.parse(localStorage.getItem(CLAVE_SOLICITUDES)) || []
    localStorage.setItem(
      CLAVE_SOLICITUDES,
      JSON.stringify(
        solicitudes.map((s) => (s.codigo === prestamo.solicitud ? { ...s, estado: 'Devuelta' } : s))
      )
    )
  } catch {
    /* sin acceso a localStorage */
  }

  return { ok: true, prestamo }
}
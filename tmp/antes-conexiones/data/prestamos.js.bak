// Base de datos de préstamos por cuenta (localStorage).
// Forma: { "correo@aloe.ulima.edu.pe": [ { codigo, equipo, fecha }, ... ] }

const CLAVE = 'bdPrestamos'

function normalizar(correo) {
  return correo.trim().toLowerCase()
}

function leerTodo() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {}
  } catch {
    return {}
  }
}

export function obtenerPrestamos(correo) {
  return leerTodo()[normalizar(correo)] || []
}

export function contarPrestamos(correo) {
  return obtenerPrestamos(correo).length
}

// Cada llamada suma un préstamo a esa cuenta y devuelve el registro creado
export function registrarPrestamo(correo, { equipo = '' } = {}) {
  const clave = normalizar(correo)
  const todo = leerTodo()
  const lista = todo[clave] || []

  const total = Object.values(todo).reduce((suma, items) => suma + items.length, 0)
  const prestamo = {
    codigo: `PRE-${new Date().getFullYear()}-${String(total + 1).padStart(4, '0')}`,
    equipo,
    fecha: new Date().toISOString()
  }

  todo[clave] = [...lista, prestamo]
  localStorage.setItem(CLAVE, JSON.stringify(todo))
  return prestamo
}
// Base de datos de retrasos por cuenta (localStorage).
// Forma: { "correo@aloe.ulima.edu.pe": [ { codigo, dias, fecha }, ... ] }

const CLAVE = 'bdRetrasos'

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

export function obtenerRetrasos(correo) {
  return leerTodo()[normalizar(correo)] || []
}

export function contarRetrasos(correo) {
  return obtenerRetrasos(correo).length
}

// Cada llamada suma un retraso a esa cuenta (codigo = código del préstamo)
export function registrarRetraso(correo, { codigo = '', dias = 1 } = {}) {
  const clave = normalizar(correo)
  const todo = leerTodo()
  const lista = todo[clave] || []

  const retraso = { codigo, dias, fecha: new Date().toISOString() }

  todo[clave] = [...lista, retraso]
  localStorage.setItem(CLAVE, JSON.stringify(todo))
  return retraso
}
// Base de datos de deudas por cuenta (localStorage).
// Forma: { "correo@aloe.ulima.edu.pe": [ { codigo, dias, monto, pagada, fecha }, ... ] }

const CLAVE = 'bdDeudas'

// Penalidad por día de retraso en soles (S/ 45.00 por 3 días = S/ 15.00 por día)
export const PENALIDAD_POR_DIA = 15

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

export function calcularPenalidad(dias) {
  return dias * PENALIDAD_POR_DIA
}

export function obtenerDeudas(correo) {
  return leerTodo()[normalizar(correo)] || []
}

export function obtenerDeudasPendientes(correo) {
  return obtenerDeudas(correo).filter((deuda) => !deuda.pagada)
}

export function totalDeuda(correo) {
  return obtenerDeudasPendientes(correo).reduce(
    (suma, deuda) => suma + deuda.monto,
    0
  )
}

// Cada llamada suma una penalidad pendiente a esa cuenta
export function registrarDeuda(correo, { codigo = '', dias = 1 } = {}) {
  const clave = normalizar(correo)
  const todo = leerTodo()
  const lista = todo[clave] || []

  const deuda = {
    codigo,
    dias,
    monto: calcularPenalidad(dias),
    pagada: false,
    fecha: new Date().toISOString()
  }

  todo[clave] = [...lista, deuda]
  localStorage.setItem(CLAVE, JSON.stringify(todo))
  return deuda
}

// Para cuando Tesorería regulariza la penalidad de un préstamo
export function pagarDeuda(correo, codigo) {
  const clave = normalizar(correo)
  const todo = leerTodo()
  const lista = todo[clave] || []

  todo[clave] = lista.map((deuda) =>
    deuda.codigo === codigo ? { ...deuda, pagada: true } : deuda
  )

  localStorage.setItem(CLAVE, JSON.stringify(todo))
}
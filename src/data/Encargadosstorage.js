// encargadosStorage.js
// Almacén de encargados registrados.
// Un navegador no puede escribir directamente en un archivo .js, así que los datos
// viven en el array `encargados` (memoria) y se respaldan en localStorage para que
// sobrevivan a recargas de página.

const STORAGE_KEY = 'almacen_equipos_encargados'

// Array principal donde se guardan los registros
export const encargados = cargarDesdeStorage()

function cargarDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistir() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encargados))
  } catch (error) {
    console.error('No se pudo guardar en localStorage:', error)
  }
}

export function correoYaRegistrado(correo) {
  return encargados.some(
    (e) => e.correo.toLowerCase() === correo.trim().toLowerCase()
  )
}

/**
 * Guarda un nuevo encargado con estado "Pendiente de aprobación".
 * @param {{nombres:string, apellidos:string, correo:string, contrasena:string, almacen:string, anexo:string}} datos
 * @returns {object} el registro guardado
 */
export function registrarEncargado(datos) {
  const nuevo = {
    id: Date.now(),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim().toLowerCase(),
    contrasena: datos.contrasena, // Solo para prototipo: en producción se guarda hasheada en el servidor
    almacen: datos.almacen,
    anexo: datos.anexo.trim(),
    estado: 'Pendiente de aprobación',
    fechaRegistro: new Date().toISOString(),
  }

  encargados.push(nuevo)
  persistir()
  return nuevo
}

export function obtenerEncargados() {
  return [...encargados]
}
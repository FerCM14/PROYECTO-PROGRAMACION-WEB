// src/data/PanelEncargado.js
// Datos compartidos por Header-Encargado, Footer-Encargado y Operacion.

import { useEffect, useState } from 'react'
import { obtenerEncargados } from './Encargadosstorage'

/* ---------- Solicitudes ---------- */

const CLAVE_SOLICITUDES = 'solicitudes' // misma clave que usa Solicitudes.js
export const ESTADO_PENDIENTE = 'Enviada' // estado que cuenta como "pendiente"

function leerSolicitudes() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_SOLICITUDES))
    return Array.isArray(datos) ? datos : []
  } catch {
    return []
  }
}

export function contarSolicitudesPendientes() {
  return leerSolicitudes().filter((s) => s.estado === ESTADO_PENDIENTE).length
}

// Se actualiza sola: sube cuando se registra una solicitud y baja cuando se aprueba, rechaza o retira.
export function useSolicitudesPendientes() {
  const [total, setTotal] = useState(contarSolicitudesPendientes)

  useEffect(() => {
    const refrescar = () => setTotal(contarSolicitudesPendientes())
    // localStorage no avisa los cambios hechos en la misma pestaña, por eso se revisa cada 1.5 s
    const intervalo = setInterval(refrescar, 1500)
    window.addEventListener('storage', refrescar)
    window.addEventListener('focus', refrescar)
    refrescar()
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('storage', refrescar)
      window.removeEventListener('focus', refrescar)
    }
  }, [])

  return total
}

/* ---------- Encargado ---------- */

// Si se pasa el correo se busca esa cuenta; si no, se usa el último encargado registrado.
export function obtenerEncargadoActual(correo) {
  const lista = obtenerEncargados()
  correo = correo || JSON.parse(localStorage.getItem('sesionActual') || 'null')?.correo
  if (correo) {
    return lista.find((e) => e.correo === String(correo).trim().toLowerCase()) || null
  }
  return lista[lista.length - 1] || null
}

const primeraPalabra = (texto = '') => texto.trim().split(/\s+/)[0] || ''
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

// "Elena Sofía" + "Rivas Talledo" -> { nombreCorto: "Elena Rivas", iniciales: "ER", ... }
export function datosPerfil(encargado) {
  if (!encargado) return null

  const nombre = capitalizar(primeraPalabra(encargado.nombres))
  const apellido = capitalizar(primeraPalabra(encargado.apellidos))
  const codigos = encargado.almacen.match(/[A-Z]-\d{3}/g)

  return {
    nombreCorto: `${nombre} ${apellido}`.trim(),
    iniciales: `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase(),
    almacen: encargado.almacen,
    codigoAlmacen: codigos ? codigos[codigos.length - 1] : encargado.almacen,
  }
}

/* ---------- Última sincronización ---------- */

const CLAVE_SYNC = 'almacen_ultima_sincronizacion'
const EVENTO_SYNC = 'sincronizacion-actualizada'

export function obtenerSincronizacion() {
  try {
    return localStorage.getItem(CLAVE_SYNC)
  } catch {
    return null
  }
}

// Se llama cada vez que se usa la página (al abrir el panel y al guardar cambios).
export function registrarSincronizacion() {
  const ahora = new Date().toISOString()
  try {
    localStorage.setItem(CLAVE_SYNC, ahora)
  } catch {
    /* sin almacenamiento disponible */
  }
  window.dispatchEvent(new Event(EVENTO_SYNC))
  return ahora
}

export function formatearFecha(iso) {
  if (!iso) return '—'
  const f = new Date(iso)
  const dos = (n) => String(n).padStart(2, '0')
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`
}

export function useUltimaSincronizacion() {
  const [iso, setIso] = useState(obtenerSincronizacion)

  useEffect(() => {
    const refrescar = () => setIso(obtenerSincronizacion())
    window.addEventListener(EVENTO_SYNC, refrescar)
    return () => window.removeEventListener(EVENTO_SYNC, refrescar)
  }, [])

  return iso
}
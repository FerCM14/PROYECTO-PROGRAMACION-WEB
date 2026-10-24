import { obtenerTodasLasReservas, cancelarReserva } from '../../data/Reservas'
import './Reservas.css'
import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import Error403 from '../comun/403'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import { obtenerProducto } from '../../data/Producto'

// Ajusta estas rutas a las de tu router
const RUTA_CALENDARIO = '/estudiante/calendario'
const RUTA_DETALLE = (id) => `/catalogo/${id}`

// Misma clave que usa el Calendario


/* ---------- Fechas (hora local, formato AAAA-MM-DD) ---------- */

const pad = (n) => String(n).padStart(2, '0')

function aISO(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`
}

function sumarDias(iso, n) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  fecha.setDate(fecha.getDate() + n)
  return aISO(fecha)
}

function fechaCorta(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function fechaLarga(iso) {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

function plural(n, singular, pluralTexto) {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}

/* ---------- Almacenamiento ---------- */

function leerReservas() {
  return obtenerTodasLasReservas().map((r) => ({ ...r, equipoId: r.productoId, inicio: r.desde, fin: r.hasta, tipo: 'Reservada' }))
}
function guardarReservas(lista) {
  const ids = new Set(lista.map((r) => r.id))
  obtenerTodasLasReservas().filter((r) => !ids.has(r.id)).forEach((r) => cancelarReserva(r.id))
}

/* ---------- Estado de cada reserva ---------- */

// Devuelve un mapa id → { estado, puesto, cola }
//  - Cumplida:   el rango ya terminó
//  - En espera:  al llegar la fecha de inicio no quedan unidades libres
//                (cuentan las reservas y préstamos hechos antes que esta)
//  - Confirmada: el resto
function calcularEstados(reservas, hoy) {
  const resultado = new Map()
  const porEquipo = new Map()

  reservas.forEach((r) => {
    if (!porEquipo.has(r.equipoId)) porEquipo.set(r.equipoId, [])
    porEquipo.get(r.equipoId).push(r)
  })

  porEquipo.forEach((grupo, equipoId) => {
    const producto = obtenerProducto(equipoId)
    const ordenado = [...grupo].sort((a, b) => a.creadaEn - b.creadaEn)
    const enEspera = []

    ordenado.forEach((r) => {
      if (r.fin < hoy) {
        resultado.set(r.id, { estado: 'Cumplida' })
        return
      }

      if (!producto) {
        resultado.set(r.id, { estado: 'Confirmada' })
        return
      }

      const mantenimiento = producto.unidades.filter((u) => u.estado === 'Mantenimiento').length
      const prestadasBase = producto.unidades.filter((u) => u.estado === 'Prestada').length
      const finBase = producto.proximaLiberacion || sumarDias(hoy, producto.duracionMax || 7)
      const base = r.inicio >= hoy && r.inicio <= finBase ? prestadasBase : 0
      const capacidad = producto.unidades.length - mantenimiento - base

      const ocupadas = ordenado.filter(
        (o) => o.creadaEn < r.creadaEn && o.inicio <= r.inicio && o.fin >= r.inicio
      ).length

      if (r.inicio > hoy && ocupadas >= capacidad) {
        enEspera.push(r.id)
        resultado.set(r.id, { estado: 'En espera' })
      } else {
        resultado.set(r.id, { estado: 'Confirmada' })
      }
    })

    enEspera.forEach((id, i) => {
      resultado.set(id, { estado: 'En espera', puesto: i + 1, cola: enEspera.length })
    })
  })

  return resultado
}

const CLASE_ESTADO = {
  Confirmada: 'confirmada',
  'En espera': 'espera',
  Cumplida: 'cumplida'
}

/* ---------- Página ---------- */

function Reservas() {
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  const [reservas, setReservas] = useState(leerReservas)
  const [aCancelar, setACancelar] = useState(null) // fila pendiente de confirmar
  const [aviso, setAviso] = useState('')

  // Cerrar el modal con Escape
  const modalAbierto = aCancelar !== null
  useEffect(() => {
    if (!modalAbierto) return undefined
    const alPulsar = (e) => {
      if (e.key === 'Escape') setACancelar(null)
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [modalAbierto])

  // Acceso: solo estudiantes con sesión iniciada
  if (!cuenta) {
    return <Navigate to="/login" replace />
  }

  if (cuenta.rol !== 'estudiante') {
    return <Error403 />
  }

  const hoy = aISO(new Date())
  const estados = calcularEstados(reservas, hoy)

  // Solo las reservas de este estudiante (los préstamos directos van en Mis solicitudes)
  const filas = reservas
    .filter((r) => r.tipo === 'Reservada' && r.correo === cuenta.correo)
    .map((r) => {
      const producto = obtenerProducto(r.equipoId)
      return {
        ...r,
        equipo: producto ? producto.titulo : 'Equipo no disponible',
        ...estados.get(r.id)
      }
    })
    .sort((a, b) => {
      const cumplidaA = a.estado === 'Cumplida'
      const cumplidaB = b.estado === 'Cumplida'
      if (cumplidaA !== cumplidaB) return cumplidaA ? 1 : -1
      return a.inicio.localeCompare(b.inicio)
    })

  const activas = filas.filter((f) => f.estado !== 'Cumplida').length
  const enEspera = filas.filter((f) => f.estado === 'En espera').length

  const cancelarReserva = () => {
    if (!aCancelar) return

    const lista = reservas.filter((r) => r.id !== aCancelar.id)
    guardarReservas(lista)
    setReservas(lista)
    setAviso(
      `Reserva cancelada del ${fechaCorta(aCancelar.inicio)} al ${fechaLarga(aCancelar.fin)}.`
    )
    setACancelar(null)
  }

  return (
    <>
      <HeaderEstudiante />

      <main className="reservas-main">
        <div className="reservas-cabecera">
          <div>
            <h1>Mis reservas</h1>
            <p className="reservas-subtitulo">
              {plural(activas, 'reserva activa', 'reservas activas')} · {enEspera} en lista de
              espera
            </p>
          </div>

          <Link to={RUTA_CALENDARIO} className="reservas-btn reservas-btn-primario">
            Nueva reserva
          </Link>
        </div>

        {aviso && (
          <div className="reservas-aviso" role="status">
            <span>{aviso}</span>
            <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

        {filas.length === 0 ? (
          <section className="reservas-vacio">
            <div className="reservas-vacio-icono" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <h2>No tienes reservas</h2>
            <p>Revisa el calendario de ocupación de un equipo y reserva con anticipación.</p>
            <Link to={RUTA_CALENDARIO} className="reservas-btn reservas-btn-primario">
              Ver calendario
            </Link>
          </section>
        ) : (
          <section className="reservas-tabla-caja">
            <div className="reservas-scroll">
              <table className="reservas-tabla">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Rango</th>
                    <th>Estado</th>
                    <th>Lista de espera</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila) => (
                    <tr
                      key={fila.id}
                      className={fila.estado === 'En espera' ? 'reservas-fila-espera' : ''}
                    >
                      <td className="reservas-equipo">{fila.equipo}</td>
                      <td className="reservas-mono">
                        {fechaCorta(fila.inicio)} → {fechaLarga(fila.fin)}
                      </td>
                      <td>
                        <span className={`reservas-estado reservas-estado-${CLASE_ESTADO[fila.estado]}`}>
                          {fila.estado}
                        </span>
                      </td>
                      <td className="reservas-mono">
                        {fila.estado === 'En espera' ? `puesto ${fila.puesto} de ${fila.cola}` : '—'}
                      </td>
                      <td>
                        {fila.estado === 'Cumplida' ? (
                          <Link to={RUTA_DETALLE(fila.equipoId)} className="reservas-accion-detalle">
                            Ver detalle
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="reservas-accion-cancelar"
                            onClick={() => setACancelar(fila)}
                          >
                            Cancelar reserva
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {aCancelar && (
        <div className="reservas-modal-fondo" onMouseDown={() => setACancelar(null)}>
          <div
            className="reservas-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reservas-modal-titulo"
            aria-describedby="reservas-modal-texto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="reservas-modal-titulo">
              ¿Cancelar la reserva del {fechaCorta(aCancelar.inicio)} al {fechaCorta(aCancelar.fin)}?
            </h2>
            <p id="reservas-modal-texto">
              {aCancelar.equipo} quedará libre para otros estudiantes
              {aCancelar.estado === 'En espera' ? ' y perderás tu lugar en la cola.' : '.'}
            </p>

            <div className="reservas-modal-acciones">
              <button
                type="button"
                className="reservas-btn reservas-btn-secundario"
                onClick={() => setACancelar(null)}
              >
                Mantener reserva
              </button>
              <button
                type="button"
                className="reservas-btn reservas-btn-peligro"
                onClick={cancelarReserva}
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterEstudiante />
    </>
  )
}

export default Reservas
import './Solicitudes.css'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import Error403 from '../comun/403'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import { obtenerSolicitudes, retirarSolicitud } from '../../data/Solicitudes'

const FILTRO_TODOS = 'todos'
const OPCIONES_ESTADO = ['Enviada', 'Aprobada', 'Entregada', 'Devuelta', 'Rechazada']

const TEXTO_RETIRADA =
  'Solicitud retirada. La unidad vuelve a quedar disponible para otros estudiantes.'
const TEXTO_NO_RETIRABLE =
  'No pudimos retirar la solicitud porque ya fue aprobada. Contacta al encargado del almacén.'

function formatearFecha(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

// "IN324 Laboratorio de Circuitos Electrónicos · Ing. Elena Rivas" → sin el docente
function nombreCurso(curso) {
  return (curso || '').split(' · ')[0]
}

function ordenarRecientes(lista) {
  return [...lista].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
}

function filtrarSolicitudes(lista, estado, desde, hasta) {
  return lista.filter((solicitud) => {
    if (estado !== FILTRO_TODOS && solicitud.estado !== estado) return false
    if (desde && solicitud.devolucion < desde) return false
    if (hasta && solicitud.inicio > hasta) return false
    return true
  })
}

function contarResumen(lista) {
  const cuenta = (...estados) =>
    lista.filter((s) => estados.includes(s.estado)).length

  return {
    pendientes: cuenta('Enviada'),
    aprobadas: cuenta('Aprobada'),
    historial: cuenta('Entregada', 'Devuelta', 'Rechazada')
  }
}

/* ---------- Estados implementados como funciones ---------- */

// Estado: todavía no hay solicitudes
function EstadoVacio({ onCatalogo }) {
  return (
    <div className="solicitudes-vacio">
      <div className="solicitudes-vacio-icono" aria-hidden="true" />
      <strong>Aún no tienes solicitudes</strong>
      <p>Busca un equipo en el catálogo y solicita tu primer préstamo.</p>
      <button type="button" className="solicitudes-btn" onClick={onCatalogo}>
        Ir al catálogo
      </button>
    </div>
  )
}

// Estado: hay solicitudes, pero ninguna coincide con los filtros
function EstadoSinCoincidencias({ onLimpiar }) {
  return (
    <div className="solicitudes-vacio">
      <strong>Ninguna solicitud coincide con los filtros</strong>
      <p>Prueba con otro estado o amplía el rango de fechas.</p>
      <button type="button" className="solicitudes-enlace" onClick={onLimpiar}>
        Limpiar filtros
      </button>
    </div>
  )
}

// Estado: notificación verde tras retirar una solicitud
function AvisoRetirada({ onCerrar }) {
  return (
    <div className="solicitudes-aviso solicitudes-aviso-exito" role="status">
      <span>{TEXTO_RETIRADA}</span>
      <button type="button" onClick={onCerrar} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  )
}

// Estado: mensaje rojo en la acción de una solicitud aprobada
function AvisoNoRetirable({ onCerrar }) {
  return (
    <div className="solicitudes-aviso solicitudes-aviso-error" role="alert">
      <span>{TEXTO_NO_RETIRABLE}</span>
      <button type="button" onClick={onCerrar} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  )
}

function InsigniaEstado({ estado }) {
  return (
    <span className={`solicitudes-estado solicitudes-estado-${estado.toLowerCase()}`}>
      {estado}
    </span>
  )
}

function AccionSolicitud({ solicitud, bloqueada, onRetirar, onVer, onCerrarBloqueo }) {
  switch (solicitud.estado) {
    case 'Enviada':
      return (
        <button
          type="button"
          className="solicitudes-accion solicitudes-accion-peligro"
          onClick={onRetirar}
        >
          Retirar solicitud
        </button>
      )

    case 'Aprobada':
      return bloqueada ? (
        <AvisoNoRetirable onCerrar={onCerrarBloqueo} />
      ) : (
        <div className="solicitudes-acciones-pila">
          <button type="button" className="solicitudes-accion" onClick={() => onVer('detalle')}>
            Ver detalle
          </button>
          <button
            type="button"
            className="solicitudes-accion solicitudes-accion-peligro"
            onClick={onRetirar}
          >
            Retirar solicitud
          </button>
        </div>
      )

    case 'Entregada':
      return (
        <button type="button" className="solicitudes-accion" onClick={() => onVer('constancia')}>
          Ver constancia
        </button>
      )

    case 'Rechazada':
      return (
        <button type="button" className="solicitudes-accion" onClick={() => onVer('motivo')}>
          Ver motivo
        </button>
      )

    default:
      return (
        <button type="button" className="solicitudes-accion" onClick={() => onVer('detalle')}>
          Ver detalle
        </button>
      )
  }
}

// Ventana con el detalle, la constancia o el motivo de rechazo
function DetalleSolicitud({ solicitud, modo, onCerrar }) {
  const titulos = {
    detalle: 'Detalle de la solicitud',
    constancia: 'Constancia de entrega',
    motivo: 'Motivo del rechazo'
  }

  return (
    <div className="solicitudes-modal-fondo" onClick={onCerrar}>
      <div
        className="solicitudes-modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulos[modo]}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{titulos[modo]}</h2>

        {modo === 'motivo' ? (
          <p className="solicitudes-modal-texto">
            {solicitud.motivoRechazo || 'El encargado no registró un motivo.'}
          </p>
        ) : (
          <dl>
            <dt>Código</dt>
            <dd className="solicitudes-mono">{solicitud.codigo}</dd>
            <dt>Equipo</dt>
            <dd>{solicitud.equipo}</dd>
            <dt>Unidad asignada</dt>
            <dd className="solicitudes-mono">{solicitud.unidad || 'Pendiente de asignar'}</dd>
            <dt>Fechas</dt>
            <dd className="solicitudes-mono">
              {formatearFecha(solicitud.inicio)} → {formatearFecha(solicitud.devolucion)}
            </dd>
            <dt>Curso</dt>
            <dd>{solicitud.curso}</dd>
            <dt>Motivo de la solicitud</dt>
            <dd>{solicitud.motivo}</dd>
          </dl>
        )}

        <button type="button" className="solicitudes-btn" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

/* ---------- Página ---------- */

function Solicitudes() {
  const navigate = useNavigate()

  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  const [solicitudes, setSolicitudes] = useState(() =>
    cuenta ? obtenerSolicitudes(cuenta.correo) : []
  )
  const [filtroEstado, setFiltroEstado] = useState(FILTRO_TODOS)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [retirada, setRetirada] = useState(false) // aviso verde
  const [bloqueada, setBloqueada] = useState(null) // código con aviso rojo
  const [detalle, setDetalle] = useState(null) // { solicitud, modo }

  // Acceso: solo estudiantes con sesión iniciada
  if (!cuenta) {
    return <Navigate to="/login" replace />
  }

  if (cuenta.rol !== 'estudiante') {
    return <Error403 />
  }

  const recientes = ordenarRecientes(solicitudes)
  const visibles = filtrarSolicitudes(recientes, filtroEstado, desde, hasta)
  const resumen = contarResumen(solicitudes)

  const limpiarFiltros = () => {
    setFiltroEstado(FILTRO_TODOS)
    setDesde('')
    setHasta('')
  }

  const retirar = (solicitud) => {
    setRetirada(false)
    setBloqueada(null)

    try {
      const respuesta = retirarSolicitud(cuenta.correo, solicitud.codigo)

      if (respuesta.ok) {
        setSolicitudes(obtenerSolicitudes(cuenta.correo))
        setRetirada(true)
        return
      }

      // Ya aprobada (u otro estado): no se puede retirar
      setBloqueada(solicitud.codigo)
    } catch (error) {
      console.error('Error al retirar la solicitud:', error)
      setBloqueada(solicitud.codigo)
    }
  }

  return (
    <>
      <HeaderEstudiante />

      <main className="solicitudes-main">
        <div className="solicitudes-cabecera">
          <div>
            <h1>Mis solicitudes</h1>
            <p className="solicitudes-resumen">
              {resumen.pendientes} {resumen.pendientes === 1 ? 'pendiente' : 'pendientes'} ·{' '}
              {resumen.aprobadas} {resumen.aprobadas === 1 ? 'aprobada' : 'aprobadas'} ·{' '}
              {resumen.historial} en el historial
            </p>
          </div>

          {solicitudes.length > 0 && (
            <div className="solicitudes-filtros">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value={FILTRO_TODOS}>Estado: todos</option>
                {OPCIONES_ESTADO.map((estado) => (
                  <option key={estado} value={estado}>
                    Estado: {estado.toLowerCase()}
                  </option>
                ))}
              </select>

              <div className="solicitudes-rango">
                <input
                  type="date"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => setDesde(e.target.value)}
                  aria-label="Desde"
                />
                <span>–</span>
                <input
                  type="date"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => setHasta(e.target.value)}
                  aria-label="Hasta"
                />
              </div>
            </div>
          )}
        </div>

        {retirada && <AvisoRetirada onCerrar={() => setRetirada(false)} />}

        {solicitudes.length === 0 ? (
          <EstadoVacio onCatalogo={() => navigate('/catalogo')} />
        ) : visibles.length === 0 ? (
          <EstadoSinCoincidencias onLimpiar={limpiarFiltros} />
        ) : (
          <div className="solicitudes-tabla-caja">
            <table className="solicitudes-tabla">
              <thead>
                <tr>
                  <th>Equipo y curso</th>
                  <th>Fechas</th>
                  <th>Unidad asignada</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((solicitud) => (
                  <tr
                    key={solicitud.codigo}
                    className={solicitud.estado === 'Aprobada' ? 'solicitudes-fila-aprobada' : ''}
                  >
                    <td>
                      <strong>{solicitud.equipo}</strong>
                      <span className="solicitudes-curso">{nombreCurso(solicitud.curso)}</span>
                    </td>

                    <td className="solicitudes-mono">
                      {formatearFecha(solicitud.inicio)} → {formatearFecha(solicitud.devolucion)}
                    </td>

                    <td>
                      {solicitud.estado === 'Rechazada' ? (
                        <span className="solicitudes-tenue">—</span>
                      ) : solicitud.unidad ? (
                        <span className="solicitudes-mono">{solicitud.unidad}</span>
                      ) : (
                        <span className="solicitudes-tenue">Pendiente de asignar</span>
                      )}
                    </td>

                    <td>
                      <InsigniaEstado estado={solicitud.estado} />
                    </td>

                    <td>
                      <AccionSolicitud
                        solicitud={solicitud}
                        bloqueada={bloqueada === solicitud.codigo}
                        onRetirar={() => retirar(solicitud)}
                        onVer={(modo) => setDetalle({ solicitud, modo })}
                        onCerrarBloqueo={() => setBloqueada(null)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {detalle && (
        <DetalleSolicitud
          solicitud={detalle.solicitud}
          modo={detalle.modo}
          onCerrar={() => setDetalle(null)}
        />
      )}

      <FooterEstudiante />
    </>
  )
}

export default Solicitudes
import { imagenEquipo } from '../../data/imagenes'
import './DetallesEquipo.css'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import HeaderEstudiante from '../Header/Header-Estudiante'
import FooterEstudiante from '../Footer/Footer-Estudiante'
import Error403 from '../comun/403'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import { useCatalogo } from '../../context/catalogo/CatalogoContext'
import { disponibilidadEquipo, proximaDevolucionEquipo } from '../../data/CupoEquipo'
import { formatearFecha } from '../../data/fechas'
import {
  obtenerDeudasPendientes,
  totalDeuda
} from '../../data/deudas'

function formatearSoles(monto) {
  return `S/ ${monto.toFixed(2)}`
}

function fechaDeHoy() {
  const hoy = new Date()
  const dia = String(hoy.getDate()).padStart(2, '0')
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${hoy.getFullYear()}`
}

/* ---------- Estados implementados como funciones ---------- */

// Estado: equipo que no existe
function EstadoNoEncontrado() {
  return (
    <main className="detalle-main">
      <div className="detalle-vacio">
        <strong>No encontramos este equipo</strong>
        <p>Puede que el enlace sea incorrecto o que el equipo ya no esté en el catálogo.</p>
        <Link to="/catalogo" className="detalle-btn-secundario detalle-btn-enlace">
          Volver al catálogo
        </Link>
      </div>
    </main>
  )
}

// Estado: cuenta con deuda pendiente (mensaje rojo)
function AvisoDeuda({ monto, cantidad }) {
  return (
    <div className="detalle-aviso detalle-aviso-deuda" role="alert">
      Con deuda pendiente:{' '}
      <span className="detalle-mono">{formatearSoles(monto)}</span>
      {cantidad > 1 ? ` en ${cantidad} penalidades` : ''} · no puedes solicitar
      hasta regularizar en Tesorería.
    </div>
  )
}

// Estado: sin unidades libres (mensaje amarillo)
function AvisoSinUnidades({ libres, total, proximaLiberacion }) {
  return (
    <div className="detalle-aviso detalle-aviso-sin-unidades" role="status">
      Sin unidades libres:{' '}
      <span className="detalle-mono">
        {libres} de {total}
      </span>{' '}
      ·{' '}
      {proximaLiberacion
        ? `devolución pactada para el ${formatearFecha(proximaLiberacion)}. La disponibilidad se confirma al devolverla.`
        : 'aún no hay fecha estimada de liberación.'}
    </div>
  )
}

function UnidadEquipo({ unidad }) {
  const clase = unidad.estado.toLowerCase()

  return (
    <div className={`detalle-unidad detalle-unidad-${clase}`}>
      <span className="detalle-mono">{unidad.codigo}</span>
      <strong>{unidad.estado}</strong>
    </div>
  )
}

/* ---------- Página ---------- */

function DetalleEquipo() {
  const { id } = useParams()
  return <DetalleEstudiante key={id} id={id} />
}

function DetalleEstudiante({ id }) {
  const { obtenerProducto, obtenerCategoria, RECOJO } = useCatalogo()
  const navigate = useNavigate()
  const [miniatura, setMiniatura] = useState(0)

  // Acceso: solo estudiantes con sesión iniciada
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  if (!cuenta) {
    return <Navigate to="/login" replace />
  }

  if (cuenta.rol !== 'estudiante') {
    return <Error403 />
  }

  const producto = obtenerProducto(id)
  const categoria = producto ? obtenerCategoria(producto.categoria) : null

  // Deudas de la cuenta (bdDeudas)
  const pendientes = obtenerDeudasPendientes(cuenta.correo)
  const deuda = totalDeuda(cuenta.correo)
  const conDeuda = deuda > 0

  if (!producto) {
    return (
      <>
        <HeaderEstudiante />
        <EstadoNoEncontrado />
        <FooterEstudiante />
      </>
    )
  }

  const { activas, libres } = disponibilidadEquipo(producto)
  const sinLibres = libres === 0
  const fotos = (producto.fotos || []).filter(Boolean).slice(0, 4)
  const galeria = fotos.length ? fotos : [imagenEquipo(producto)]

  const condiciones = [
    producto.duracionMax === null ? (
      <strong key="d">Sin límite de días</strong>
    ) : (
      <span key="d">
        Hasta <strong>{producto.duracionMax} días calendario</strong>
      </span>
    ),
    producto.autorizacion
      ? 'requiere autorización del docente'
      : 'no requiere autorización',
    producto.renovable ? 'admite renovación' : 'no admite renovación',
    Number.isFinite(producto.penalizacion)
      ? `penalidad de ${formatearSoles(producto.penalizacion)} por día de retraso`
      : 'penalidad diaria sin informar'
  ]

  return (
    <>
      <HeaderEstudiante />

      <main className="detalle-main">
        <nav className="detalle-ruta" aria-label="Ruta">
          <Link to="/catalogo">Catálogo</Link> / {categoria?.nombre} /{' '}
          {producto.nombre}
        </nav>

        <div className="detalle-layout">
          {/* ----- Galería ----- */}
          <div className="detalle-galeria">
            <div className="detalle-foto-principal">
              <img src={galeria[miniatura] || galeria[0]} alt={producto.nombre} />
            </div>

            <div className="detalle-miniaturas">
              {galeria.map((foto, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === miniatura ? 'activa' : ''}
                  onClick={() => setMiniatura(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === miniatura}
                ><img src={foto} alt="" /></button>
              ))}
            </div>
          </div>

          {/* ----- Información ----- */}
          <section className="detalle-card detalle-info">
            <h1>{producto.nombre}</h1>

            <p className="detalle-meta">
              {producto.marca} · {producto.modelo} · <strong>{categoria?.nombre}</strong>
            </p>

            <p className="detalle-descripcion">{producto.descripcion}</p>

            {producto.accesorios.length > 0 && (
              <>
                <h2 className="detalle-subtitulo">Accesorios incluidos</h2>
                <ul className="detalle-accesorios">
                  {producto.accesorios.map((accesorio) => (
                    <li key={accesorio}>{accesorio}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="detalle-condiciones">
              <strong>Condiciones del préstamo</strong>
              <p>
                {condiciones.map((condicion, i) => (
                  <span key={i}>
                    {i > 0 && ' · '}
                    {condicion}
                  </span>
                ))}
                .
              </p>
            </div>

            <h2 className="detalle-subtitulo">Unidades de este equipo</h2>
            <div className="detalle-unidades">
              {activas.map((unidad) => (
                <UnidadEquipo key={unidad.codigo} unidad={unidad} />
              ))}
            </div>
          </section>

          {/* ----- Panel de disponibilidad ----- */}
          <aside className="detalle-card detalle-panel">
            <p className="detalle-etiqueta">Disponibilidad</p>

            <p
              className={
                sinLibres
                  ? 'detalle-contador detalle-contador-cero'
                  : 'detalle-contador'
              }
            >
              {libres} de {activas.length}
            </p>
            <p className="detalle-contador-nota">
              unidades libres hoy, {fechaDeHoy()}
            </p>

            {conDeuda && (
              <AvisoDeuda monto={deuda} cantidad={pendientes.length} />
            )}

            {!activas.length && <p role="status">Este equipo no tiene unidades activas para préstamo o reserva.</p>}
            {sinLibres && activas.length > 0 && (
              <AvisoSinUnidades
                libres={libres}
                total={activas.length}
                proximaLiberacion={proximaDevolucionEquipo(producto)}
              />
            )}

            {conDeuda ? (
              <button
                type="button"
                className="detalle-btn-primario"
                onClick={() => navigate('/cuenta')}
              >
                Ver mi deuda
              </button>
            ) : !activas.length ? null : sinLibres ? (
              <button
                type="button"
                className="detalle-btn-primario"
                onClick={() => navigate(`/estudiante/calendario?equipo=${producto.id}`)}
              >
                Reservar
              </button>
            ) : (
              <button
                type="button"
                className="detalle-btn-primario"
                onClick={() => navigate(`/catalogo/${producto.id}/solicitar`)}
              >
                Solicitar préstamo
              </button>
            )}

            <button
              type="button"
              className="detalle-btn-secundario"
              disabled={!activas.length}
              onClick={() => navigate(`/estudiante/calendario?equipo=${producto.id}`)}
            >
              Ver calendario de ocupación
            </button>

            <p className="detalle-recojo">
              Recojo en <strong>{RECOJO.lugar}</strong> · {RECOJO.horario}.
            </p>
          </aside>
        </div>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default DetalleEquipo

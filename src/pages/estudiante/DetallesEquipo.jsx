import './DetallesEquipo.css'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import Error403 from '../comun/403'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import { obtenerProducto, obtenerCategoria, RECOJO } from '../../data/Producto'
import {
  obtenerDeudasPendientes,
  totalDeuda,
  PENALIDAD_POR_DIA
} from '../../data/deudas'

const MINIATURAS = [0, 1, 2]

function formatearSoles(monto) {
  return `S/ ${monto.toFixed(2)}`
}

function formatearFechaISO(iso) {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
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
        ? `la próxima se libera el ${formatearFechaISO(proximaLiberacion)}.`
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

  const sinLibres = producto.libres === 0

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
    `penalidad de ${formatearSoles(PENALIDAD_POR_DIA)} por día de retraso`
  ]

  return (
    <>
      <HeaderEstudiante />

      <main className="detalle-main">
        <nav className="detalle-ruta" aria-label="Ruta">
          <Link to="/catalogo">Catálogo</Link> / {categoria?.nombre} /{' '}
          {producto.titulo}
        </nav>

        <div className="detalle-layout">
          {/* ----- Galería ----- */}
          <div className="detalle-galeria">
            <div className="detalle-foto-principal">
              fotografía principal 1:1
            </div>

            <div className="detalle-miniaturas">
              {MINIATURAS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={i === miniatura ? 'activa' : ''}
                  onClick={() => setMiniatura(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === miniatura}
                />
              ))}
            </div>
          </div>

          {/* ----- Información ----- */}
          <section className="detalle-card detalle-info">
            <h1>{producto.titulo}</h1>

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
              {producto.unidades.map((unidad) => (
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
              {producto.libres} de {producto.total}
            </p>
            <p className="detalle-contador-nota">
              unidades libres hoy, {fechaDeHoy()}
            </p>

            {conDeuda && (
              <AvisoDeuda monto={deuda} cantidad={pendientes.length} />
            )}

            {sinLibres && (
              <AvisoSinUnidades
                libres={producto.libres}
                total={producto.total}
                proximaLiberacion={producto.proximaLiberacion}
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
            ) : sinLibres ? (
              <button
                type="button"
                className="detalle-btn-primario"
                onClick={() => navigate('/reservas')}
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
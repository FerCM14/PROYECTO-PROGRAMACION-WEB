import { useActualizacion } from '../../context/DatosContext'
import { imagenEquipo } from '../../data/imagenes'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import HeaderVisitante from '../Header/Header-Visitante'
import FooterEstudiante from '../Footer/Footer-Estudiante'
import { useCatalogo } from '../../context/catalogo/CatalogoContext'
import './FichaPublica.css'

// Productos.js todavía no guarda la penalidad por equipo; si algún día
// agregas `penalidad` al producto, se usará ese valor.
const PENALIDAD_POR_DEFECTO = 20

const ORDEN_ESTADOS = { Disponible: 0, Prestada: 1, Mantenimiento: 2 }

function claseEstado(estado) {
  if (estado === 'Disponible') return 'fp-estado-disponible'
  if (estado === 'Mantenimiento') return 'fp-estado-mantenimiento'
  return 'fp-estado-prestada'
}

function formatearFecha(fecha) {
  // fecha en formato AAAA-MM-DD
  const [anio, mes, dia] = String(fecha).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha
}

export default function FichaPublica() {
  const { obtenerProducto, obtenerCategoria, RECOJO } = useCatalogo()
  const { id } = useParams()
  useActualizacion()
  const producto = /^[0-9]+$/.test(id ?? '') && Number.isSafeInteger(Number(id)) ? obtenerProducto(id) : null

  if (!producto) {
    return (
      <div className="fp-pagina">
        <HeaderVisitante />
        <main className="fp-main">
          <section className="fp-no-encontrado">
            <h1>{id ? 'No encontramos este equipo' : 'Consulta los equipos del catálogo'}</h1>
            <p>{id ? 'El enlace puede ser incorrecto o el equipo puede haber sido retirado.' : 'Selecciona un equipo para consultar su ficha pública.'}</p>
            <Link to="/catalogo" className="fp-btn fp-btn-primario">Volver al catálogo</Link>
          </section>
        </main>
        <FooterEstudiante />
      </div>
    )
  }

  const categoria = obtenerCategoria(producto.categoria)
  return <DetallePublico key={producto.id} producto={producto} categoria={categoria} recojo={RECOJO} />
}

function DetallePublico({ producto, categoria, recojo }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [fotoActiva, setFotoActiva] = useState(0)
  const nombre = producto.nombre?.trim() || 'Equipo'
  const identificacion = [producto.marca, producto.modelo].filter((dato) => typeof dato === 'string' && dato.trim()).join(' · ')
  const nombreCategoria = categoria?.nombre || 'Sin categoría'

  const hoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  function solicitarPrestamo() {
    // El visitante debe iniciar sesión; se guarda a dónde volver
    navigate('/login', { state: { desde: location.pathname } })
  }

  const fotos = producto.fotos?.length ? producto.fotos : [imagenEquipo(producto)]
  const penalidad = Number(producto.penalizacion ?? producto.penalidad ?? PENALIDAD_POR_DEFECTO)

  const unidades = [...producto.unidades].sort(
    (a, b) =>
      (ORDEN_ESTADOS[a.estado] ?? 9) - (ORDEN_ESTADOS[b.estado] ?? 9) ||
      a.codigo.localeCompare(b.codigo)
  )
  const libres = unidades.filter((u) => u.estado === 'Disponible').length

  const textoDuracion =
    producto.duracionMax == null ? 'Sin límite de días' : `Hasta ${producto.duracionMax} días calendario`
  const textoAutorizacion = producto.autorizacion
    ? 'requiere autorización del docente'
    : 'no requiere autorización adicional'
  const textoRenovacion = producto.renovable ? 'admite una renovación' : 'no admite renovación'

  return (
    <div className="fp-pagina">
      <HeaderVisitante />

      <main className="fp-main">
        <nav className="fp-migas" aria-label="Ruta de navegación">
          <Link to="/catalogo">Catálogo</Link> / {nombreCategoria} / <span aria-current="page">{nombre}</span>
        </nav>

        <div className="fp-grid">
          {/* Galería */}
          <section className="fp-galeria" aria-label="Fotografías del equipo">
            <div className="fp-foto-principal">
              {fotos[fotoActiva] ? (
                <img src={fotos[fotoActiva]} alt={`${nombre}, foto ${fotoActiva + 1}`} />
              ) : (
                <span>fotografía principal 1:1</span>
              )}
            </div>

            <div className="fp-miniaturas">
              {[0, 1, 2].map((i) =>
                fotos[i] ? (
                  <button
                    key={i}
                    type="button"
                    className={`fp-miniatura ${i === fotoActiva ? 'fp-miniatura-activa' : ''}`}
                    onClick={() => setFotoActiva(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={i === fotoActiva}
                  >
                    <img src={fotos[i]} alt="" />
                  </button>
                ) : (
                  <div key={i} className="fp-miniatura fp-miniatura-vacia" aria-hidden="true" />
                )
              )}
            </div>
          </section>

          {/* Detalle */}
          <section className="fp-detalle">
            <h1>{nombre}</h1>
            <p className="fp-meta">
              {identificacion && <>{identificacion} · </>}
              <strong>{nombreCategoria}</strong>
            </p>

            {producto.descripcion && <p className="fp-descripcion">{producto.descripcion}</p>}

            {producto.accesorios.length > 0 && (
              <>
                <h2 className="fp-etiqueta">Accesorios incluidos</h2>
                <ul className="fp-accesorios">
                  {producto.accesorios.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="fp-condiciones">
              <strong>Condiciones del préstamo</strong>
              <p>
                <b>{textoDuracion}</b> · {textoAutorizacion} · {textoRenovacion} · penalidad de{' '}
                <span className="fp-mono">S/ {penalidad.toFixed(2)}</span> por día de retraso.
              </p>
            </div>
          </section>

          {/* Disponibilidad */}
          <aside className="fp-disponibilidad" aria-label="Disponibilidad">
            <h2 className="fp-etiqueta">Disponibilidad actual</h2>

            {unidades.length === 0 ? (
              <p className="fp-sin-unidades">Este equipo aún no tiene unidades registradas.</p>
            ) : (
              <>
                <p className="fp-contador">
                  {libres} de {unidades.length}
                </p>
                <p className="fp-contador-sub">unidades libres hoy, {hoy}</p>

                {libres === 0 && producto.proximaLiberacion && (
                  <p className="fp-liberacion">
                    Próxima unidad disponible el {formatearFecha(producto.proximaLiberacion)}.
                  </p>
                )}

                <ul className="fp-unidades">
                  {unidades.map((u) => (
                    <li key={u.codigo}>
                      <span className="fp-mono">{u.codigo}</span>
                      <span className={`fp-estado ${claseEstado(u.estado)}`}>{u.estado}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button type="button" className="fp-btn fp-btn-primario fp-btn-ancho" onClick={solicitarPrestamo}>
              Solicitar préstamo
            </button>
            <p className="fp-aviso">Necesitas iniciar sesión para solicitar.</p>

            <p className="fp-recojo">
              Recojo en <strong>{recojo.lugar}</strong>, {recojo.horario}.
            </p>
          </aside>
        </div>
      </main>

      <FooterEstudiante />
    </div>
  )
}

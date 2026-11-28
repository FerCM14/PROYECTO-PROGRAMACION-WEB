import { useActualizacion } from '../../context/DatosContext'
import { imagenEquipo } from '../../data/imagenes'
import { formatearFecha, hoyISO } from '../../data/fechas'
import { obtenerPrestamos } from '../../data/Identificacion'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import HeaderVisitante from '../Header/Header-Visitante'
import FooterEstudiante from '../Footer/Footer-Estudiante'
import { useCatalogo } from '../../context/catalogo/CatalogoContext'
import { useAuth } from '../../context/cuentas/AuthContext'
import './FichaPublica.css'

const ESTADOS = {
  Disponible: { orden: 0, clase: 'disponible', etiqueta: 'Disponible' },
  Mantenimiento: { orden: 1, clase: 'mantenimiento', etiqueta: 'En mantenimiento' },
  Prestada: { orden: 2, clase: 'prestada', etiqueta: 'Prestada' }
}
const ESTADO_DESCONOCIDO = { orden: 4, clase: 'sin-dato', etiqueta: 'Estado sin informar' }

function presentarEstado(estado) {
  return Object.hasOwn(ESTADOS, estado) ? ESTADOS[estado] : ESTADO_DESCONOCIDO
}

function proximaDevolucion(unidades, hoy) {
  const codigosPrestados = unidades.filter((u) => u.estado === 'Prestada').map((u) => u.codigo)
  return obtenerPrestamos()
    .filter((p) => p.estado === 'Entregado' && codigosPrestados.includes(p.unidad))
    .map((p) => p.hasta)
    .filter((fecha) => typeof fecha === 'string' && fecha >= hoy && formatearFecha(fecha) !== '—')
    .sort()[0]
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
  const { usuario } = useAuth()
  const location = useLocation()
  const [fotoActiva, setFotoActiva] = useState(0)
  const nombre = producto.nombre?.trim() || 'Equipo'
  const identificacion = [producto.marca, producto.modelo].filter((dato) => typeof dato === 'string' && dato.trim()).join(' · ')
  const nombreCategoria = categoria?.nombre || 'Sin categoría'
  const descripcion = typeof producto.descripcion === 'string' ? producto.descripcion.trim() : ''
  const accesorios = Array.isArray(producto.accesorios)
    ? producto.accesorios.filter((accesorio) => typeof accesorio === 'string' && accesorio.trim())
    : []

  const hoy = hoyISO()

  const alternativa = imagenEquipo({ ...producto, fotos: [] })
  const fotosGuardadas = Array.isArray(producto.fotos)
    ? producto.fotos.filter((foto) => typeof foto === 'string' && foto.trim()).slice(0, 4)
    : []
  const fotos = fotosGuardadas.length ? fotosGuardadas : [alternativa]
  const indiceFoto = fotoActiva < fotos.length ? fotoActiva : 0
  const penalidad = producto.penalizacion

  const unidades = producto.unidades.filter((unidad) => unidad.estado !== 'De baja').sort(
    (a, b) =>
      presentarEstado(a.estado).orden - presentarEstado(b.estado).orden ||
      a.codigo.localeCompare(b.codigo)
  )
  const libres = producto.libres
  const todasDeBaja = producto.unidades.length > 0 && unidades.length === 0
  const devolucionPactada = libres === 0 && unidades.length > 0 ? proximaDevolucion(unidades, hoy) : null
  const puedeSolicitar = unidades.length > 0 && (!usuario || usuario.rol === 'estudiante')
  const accion = libres > 0 || !unidades.length ? 'Solicitar préstamo' : 'Consultar opciones de reserva'
  const destino = !usuario ? '/login' : libres > 0 ? `/catalogo/${producto.id}/solicitar` : `/catalogo/${producto.id}`

  const textoDuracion =
    producto.duracionMax == null
      ? 'sin límite de días'
      : `de hasta ${producto.duracionMax} ${producto.duracionMax === 1 ? 'día calendario' : 'días calendario'}`
  const textoAutorizacion = producto.autorizacion
    ? 'Requiere la autorización del docente del curso asociado.'
    : 'No requiere autorización del docente.'
  const textoRenovacion = producto.renovable ? 'Admite renovación.' : 'No admite renovación.'

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
              <FotoEquipo key={fotos[indiceFoto]} origen={fotos[indiceFoto]} alternativa={alternativa} alt={`${nombre}, foto ${indiceFoto + 1}`} />
            </div>

            <div className="fp-miniaturas">
              {fotos.map((foto, i) => (
                  <button
                    key={`${i}-${foto}`}
                    type="button"
                    className={`fp-miniatura ${i === indiceFoto ? 'fp-miniatura-activa' : ''}`}
                    onClick={() => setFotoActiva(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={i === indiceFoto}
                  >
                    <FotoEquipo origen={foto} alternativa={alternativa} alt="" />
                  </button>
              ))}
            </div>
          </section>

          {/* Detalle */}
          <section className="fp-detalle">
            <h1>{nombre}</h1>
            <p className="fp-meta">
              {identificacion && <>{identificacion} · </>}
              <strong>{nombreCategoria}</strong>
            </p>

            {descripcion && <p className="fp-descripcion">{descripcion}</p>}

            {accesorios.length > 0 && (
              <>
                <h2 className="fp-etiqueta">Accesorios incluidos</h2>
                <ul className="fp-accesorios">
                  {accesorios.map((accesorio, indice) => (
                    <li key={`${accesorio}-${indice}`}>{accesorio}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="fp-condiciones">
              <strong>Condiciones del préstamo</strong>
              <p>
                Préstamo <b>{textoDuracion}</b>. {textoAutorizacion} <b>{textoRenovacion}</b>{' '}
                {Number.isFinite(penalidad) ? (
                  <>El retraso genera una penalidad de <span className="fp-mono">S/ {penalidad.toFixed(2)}</span> por día.</>
                ) : 'La penalidad diaria aún no está informada.'}
              </p>
            </div>
          </section>

          {/* Disponibilidad */}
          <aside className="fp-disponibilidad" aria-label="Disponibilidad">
            <h2 className="fp-etiqueta">Disponibilidad actual</h2>

            {unidades.length === 0 ? (
              <p className="fp-sin-unidades">
                {todasDeBaja ? 'Este equipo ya no tiene unidades activas para nuevos préstamos.' : 'Este equipo aún no tiene unidades registradas.'}
              </p>
            ) : (
              <>
                <p className="fp-contador">
                  {libres} de {unidades.length}
                </p>
                <p className="fp-contador-sub">unidades libres hoy, {formatearFecha(hoy)}</p>

                {libres === 0 && (
                  <p className="fp-liberacion">
                    {devolucionPactada ? (
                      <>Devolución pactada más próxima: <time dateTime={devolucionPactada}>{formatearFecha(devolucionPactada)}</time>. La disponibilidad se confirma al registrar la devolución.</>
                    ) : 'Aún no hay una fecha confirmada de próxima disponibilidad.'}
                  </p>
                )}

                <ul className="fp-unidades" aria-label="Códigos y estados de las unidades">
                  {unidades.map((unidad) => {
                    const estado = presentarEstado(unidad.estado)
                    return (
                      <li key={unidad.codigo}>
                        <span className="fp-mono">{unidad.codigo}</span>
                        <span className={`fp-estado fp-estado-${estado.clase}`}>{estado.etiqueta}</span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {puedeSolicitar ? (
              <>
                <Link
                  to={destino}
                  state={!usuario ? { desde: location.pathname } : undefined}
                  className="fp-btn fp-btn-primario fp-btn-ancho"
                >
                  {accion}
                </Link>
                {!usuario && <p className="fp-aviso">Necesitas iniciar sesión para continuar.</p>}
              </>
            ) : (
              <>
                <button type="button" className="fp-btn fp-btn-primario fp-btn-ancho" disabled>{accion}</button>
                {unidades.length > 0 && <p className="fp-aviso">Solo las cuentas de estudiante pueden solicitar préstamos.</p>}
              </>
            )}

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

function FotoEquipo({ origen, alternativa, alt }) {
  const [fuente, setFuente] = useState(origen)
  if (!fuente) return alt ? <span>Fotografía no disponible</span> : null

  return <img src={fuente} alt={alt} onError={() => setFuente(fuente === alternativa ? '' : alternativa)} />
}

import { useActualizacion } from '../../context/DatosContext'
import { imagenEquipo } from '../../data/imagenes'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import HeaderVisitante from '../Header/Header-Visitante'
import FooterEstudiante from '../Footer/Footer-Estudiante'
import { useCatalogo } from '../../context/catalogo/CatalogoContext'
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
  const descripcion = typeof producto.descripcion === 'string' ? producto.descripcion.trim() : ''
  const accesorios = Array.isArray(producto.accesorios)
    ? producto.accesorios.filter((accesorio) => typeof accesorio === 'string' && accesorio.trim())
    : []

  const hoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  function solicitarPrestamo() {
    // El visitante debe iniciar sesión; se guarda a dónde volver
    navigate('/login', { state: { desde: location.pathname } })
  }

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
                <p className="fp-contador-sub">unidades libres hoy, {hoy}</p>

                {libres === 0 && producto.proximaLiberacion && (
                  <p className="fp-liberacion">
                    Próxima unidad disponible el {formatearFecha(producto.proximaLiberacion)}.
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

            <button type="button" className="fp-btn fp-btn-primario fp-btn-ancho" onClick={solicitarPrestamo} disabled={!unidades.length}>
              Solicitar préstamo
            </button>
            {unidades.length > 0 && <p className="fp-aviso">Necesitas iniciar sesión para solicitar.</p>}

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

import './Catalogo.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import HeaderVisitante from '../../components/Header/Header-Visitante'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import {
  CATEGORIAS,
  PRODUCTOS,
  obtenerCategoria,
  contarPorCategoria
} from '../../data/Producto'

const POR_PAGINA = 8
const TIEMPO_CARGA = 500

// Sin ningún filtro (lo que deja "Limpiar todo")
const FILTROS_VACIOS = {
  categorias: [],
  disponibilidad: 'todas', // 'todas' | 'libres'
  duracion: 'sin-limite' // '7' | '15' | 'sin-limite'
}

// Opciones que aparecen marcadas en el panel al abrir (como en el diseño).
// No se aplican hasta que se presione "Aplicar filtros".
const FILTROS_INICIALES = {
  categorias: [],
  disponibilidad: 'libres',
  duracion: '7'
}

const ORDENES = [
  { valor: 'disponibles', texto: 'Ordenar: más disponibles' },
  { valor: 'az', texto: 'Ordenar: nombre A-Z' },
  { valor: 'za', texto: 'Ordenar: nombre Z-A' },
  { valor: 'categoria', texto: 'Ordenar: categoría' }
]

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function filtrarProductos(filtros, busqueda) {
  const termino = normalizarTexto(busqueda.trim())

  return PRODUCTOS.filter((producto) => {
    if (
      filtros.categorias.length > 0 &&
      !filtros.categorias.includes(producto.categoria)
    ) {
      return false
    }

    if (filtros.disponibilidad === 'libres' && producto.libres === 0) {
      return false
    }

    if (filtros.duracion !== 'sin-limite') {
      const limite = Number(filtros.duracion)
      if (producto.duracionMax === null || producto.duracionMax > limite) {
        return false
      }
    }

    if (termino) {
      const texto = normalizarTexto(
        `${producto.nombre} ${producto.marca} ${producto.modelo} ${producto.codigo}`
      )
      if (!texto.includes(termino)) return false
    }

    return true
  })
}

function ordenarProductos(lista, orden) {
  const copia = [...lista]
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')

  if (orden === 'az') return copia.sort(porNombre)
  if (orden === 'za') return copia.sort((a, b) => porNombre(b, a))
  if (orden === 'categoria') {
    return copia.sort(
      (a, b) => a.categoria.localeCompare(b.categoria, 'es') || porNombre(a, b)
    )
  }

  return copia.sort((a, b) => b.libres - a.libres || porNombre(a, b))
}

function crearSubtitulo(cantidad, filtros) {
  const equipos = `${cantidad} ${cantidad === 1 ? 'equipo' : 'equipos'}`
  const partes = []

  if (filtros.disponibilidad === 'libres') partes.push('con unidades libres')
  if (filtros.duracion !== 'sin-limite') {
    partes.push(`préstamo de hasta ${filtros.duracion} días`)
  }

  if (partes.length === 0) return `${equipos} en el catálogo`
  return `${equipos} ${partes.join(' y ')}`
}

function crearChips(filtros) {
  const chips = filtros.categorias.map((id) => ({
    clave: `categoria-${id}`,
    tipo: 'categoria',
    valor: id,
    texto: `Categoría: ${obtenerCategoria(id)?.nombre.toLowerCase() || id}`
  }))

  if (filtros.disponibilidad === 'libres') {
    chips.push({
      clave: 'disponibilidad',
      tipo: 'disponibilidad',
      texto: 'Con unidades libres'
    })
  }

  if (filtros.duracion !== 'sin-limite') {
    chips.push({
      clave: 'duracion',
      tipo: 'duracion',
      texto: `Hasta ${filtros.duracion} días`
    })
  }

  return chips
}

/* ---------- Estados implementados como funciones ---------- */

// Estado: sin resultados (dentro de la retícula)
function EstadoSinResultados({ onLimpiar }) {
  return (
    <div className="catalogo-vacio">
      <div className="catalogo-vacio-icono" aria-hidden="true">
        ?
      </div>
      <strong>Ningún equipo coincide con estos filtros</strong>
      <p>Prueba ampliando la duración máxima o revisa otra categoría.</p>
      <button type="button" className="catalogo-enlace" onClick={onLimpiar}>
        Limpiar todo
      </button>
    </div>
  )
}

// Estado: cargando con esqueletos
function EstadoCargando() {
  return (
    <div role="status" aria-live="polite">
      <p className="catalogo-cargando-texto">Cargando equipos...</p>
      <div className="catalogo-grid">
        {Array.from({ length: POR_PAGINA }, (_, i) => (
          <div key={i} className="catalogo-card catalogo-esqueleto" aria-hidden="true">
            <div className="catalogo-foto" />
            <div className="catalogo-info">
              <div className="catalogo-barra catalogo-barra-larga" />
              <div className="catalogo-barra catalogo-barra-corta" />
              <div className="catalogo-barra catalogo-barra-media" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TarjetaProducto({ producto, onVer }) {
  const categoria = obtenerCategoria(producto.categoria)
  const sinStock = producto.libres === 0

  return (
    <article
      className="catalogo-card catalogo-card-link"
      onClick={onVer}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onVer()
      }}
      tabIndex={0}
    >
      <div className="catalogo-foto">foto 1:1</div>

      <div className="catalogo-info">
        <h3>{producto.nombre}</h3>
        <p className="catalogo-modelo">
          {producto.marca} · {producto.modelo}
        </p>

        <div className="catalogo-pie">
          <span className="catalogo-etiqueta">{categoria?.etiqueta}</span>
          <span
            className={
              sinStock ? 'catalogo-libres catalogo-libres-cero' : 'catalogo-libres'
            }
          >
            {producto.libres} / {producto.total} libres
          </span>
        </div>
      </div>
    </article>
  )
}

/* ---------- Página ---------- */

function Catalogo() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS) // aplicados (sin recuadros al inicio)
  const [borrador, setBorrador] = useState(FILTROS_INICIALES) // sin aplicar
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('disponibles')
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(false)

  const temporizador = useRef(null)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const simularCarga = () => {
    clearTimeout(temporizador.current)
    setCargando(true)
    temporizador.current = setTimeout(() => setCargando(false), TIEMPO_CARGA)
  }

  const resultados = useMemo(
    () => ordenarProductos(filtrarProductos(filtros, busqueda), orden),
    [filtros, busqueda, orden]
  )

  // Acceso: solo estudiantes con sesión iniciada
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  const esEstudiante = cuenta?.rol === 'estudiante' && !cuenta.bloqueada

  const totalPaginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const visibles = resultados.slice(inicio, inicio + POR_PAGINA)
  const chips = crearChips(filtros)

  /* ----- Panel de filtros (borrador) ----- */

  const alternarCategoria = (id) => {
    const categorias = borrador.categorias.includes(id)
      ? borrador.categorias.filter((c) => c !== id)
      : [...borrador.categorias, id]

    setBorrador({ ...borrador, categorias })
  }

  const aplicarFiltros = () => {
    setFiltros(borrador)
    setPagina(1)
    simularCarga()
  }

  const limpiarTodo = () => {
    setFiltros(FILTROS_VACIOS)
    setBorrador(FILTROS_VACIOS)
    setBusqueda('')
    setPagina(1)
    simularCarga()
  }

  const quitarFiltro = (chip) => {
    const quitar = (actual) => {
      if (chip.tipo === 'categoria') {
        return {
          ...actual,
          categorias: actual.categorias.filter((c) => c !== chip.valor)
        }
      }
      if (chip.tipo === 'disponibilidad') {
        return { ...actual, disponibilidad: FILTROS_VACIOS.disponibilidad }
      }
      return { ...actual, duracion: FILTROS_VACIOS.duracion }
    }

    setFiltros(quitar(filtros))
    setBorrador(quitar(borrador))
    setPagina(1)
    simularCarga()
  }

  /* ----- Orden, búsqueda y paginación ----- */

  const cambiarOrden = (e) => {
    setOrden(e.target.value)
    setPagina(1)
    simularCarga()
  }

  const cambiarBusqueda = (e) => {
    setBusqueda(e.target.value)
    setPagina(1)
  }

  const irAPagina = (numero) => {
    if (numero < 1 || numero > totalPaginas || numero === paginaActual) return
    setPagina(numero)
    simularCarga()
  }

  return (
    <>
      {esEstudiante ? <HeaderEstudiante /> : <HeaderVisitante />}

      <main className="catalogo-main">
        <div className="catalogo-layout">
          {/* ----- Filtros ----- */}
          <aside className="catalogo-filtros">
            <h2>Filtros</h2>

            <fieldset>
              <legend>Categoría</legend>
              {CATEGORIAS.map((categoria) => (
                <label key={categoria.id} className="catalogo-opcion">
                  <input
                    type="checkbox"
                    checked={borrador.categorias.includes(categoria.id)}
                    onChange={() => alternarCategoria(categoria.id)}
                  />
                  <span>
                    {categoria.nombre}{' '}
                    <em>({contarPorCategoria(categoria.id)})</em>
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Disponibilidad</legend>
              <label className="catalogo-opcion">
                <input
                  type="radio"
                  name="disponibilidad"
                  checked={borrador.disponibilidad === 'libres'}
                  onChange={() =>
                    setBorrador({ ...borrador, disponibilidad: 'libres' })
                  }
                />
                <span>Con unidades libres</span>
              </label>
              <label className="catalogo-opcion">
                <input
                  type="radio"
                  name="disponibilidad"
                  checked={borrador.disponibilidad === 'todas'}
                  onChange={() =>
                    setBorrador({ ...borrador, disponibilidad: 'todas' })
                  }
                />
                <span>Todas</span>
              </label>
            </fieldset>

            <fieldset>
              <legend>Duración máxima</legend>
              {[
                { valor: '7', texto: 'Hasta 7 días' },
                { valor: '15', texto: 'Hasta 15 días' },
                { valor: 'sin-limite', texto: 'Sin límite' }
              ].map((opcion) => (
                <label key={opcion.valor} className="catalogo-opcion">
                  <input
                    type="radio"
                    name="duracion"
                    checked={borrador.duracion === opcion.valor}
                    onChange={() =>
                      setBorrador({ ...borrador, duracion: opcion.valor })
                    }
                  />
                  <span>{opcion.texto}</span>
                </label>
              ))}
            </fieldset>

            <button
              type="button"
              className="catalogo-btn-filtrar"
              onClick={aplicarFiltros}
            >
              Aplicar filtros
            </button>

            <button
              type="button"
              className="catalogo-enlace catalogo-enlace-centro"
              onClick={limpiarTodo}
            >
              Limpiar todo
            </button>
          </aside>

          {/* ----- Resultados ----- */}
          <section className="catalogo-contenido">
            <div className="catalogo-cabecera">
              <div>
                <h1>Catálogo de equipos</h1>
                <p className="catalogo-subtitulo">
                  {crearSubtitulo(resultados.length, filtros)}
                </p>
              </div>

              <div className="catalogo-herramientas">
                <input
                  type="search"
                  className="catalogo-buscador"
                  placeholder="Buscar equipo o código de inventario"
                  aria-label="Buscar equipo o código de inventario"
                  value={busqueda}
                  onChange={cambiarBusqueda}
                />

                <select
                  className="catalogo-orden"
                  value={orden}
                  onChange={cambiarOrden}
                  aria-label="Ordenar equipos"
                >
                  {ORDENES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="catalogo-chips">
                {chips.map((chip) => (
                  <span key={chip.clave} className="catalogo-chip">
                    {chip.texto}
                    <button
                      type="button"
                      aria-label={`Quitar filtro: ${chip.texto}`}
                      onClick={() => quitarFiltro(chip)}
                    >
                      ×
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  className="catalogo-enlace"
                  onClick={limpiarTodo}
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {cargando ? (
              <EstadoCargando />
            ) : resultados.length === 0 ? (
              <EstadoSinResultados onLimpiar={limpiarTodo} />
            ) : (
              <>
                <div className="catalogo-grid">
                  {visibles.map((producto) => (
                    <TarjetaProducto
                      key={producto.id}
                      producto={producto}
                      onVer={() => navigate(esEstudiante ? `/catalogo/${producto.id}` : `/visitante/cata/${producto.id}`)}
                    />
                  ))}
                </div>

                <div className="catalogo-paginacion">
                  <p>
                    Mostrando {inicio + 1} a {inicio + visibles.length} de{' '}
                    {resultados.length} equipos
                  </p>

                  <nav aria-label="Paginación">
                    <button
                      type="button"
                      onClick={() => irAPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      aria-label="Página anterior"
                    >
                      ‹
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                      (numero) => (
                        <button
                          key={numero}
                          type="button"
                          className={numero === paginaActual ? 'activa' : ''}
                          onClick={() => irAPagina(numero)}
                          aria-current={numero === paginaActual ? 'page' : undefined}
                        >
                          {numero}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => irAPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      aria-label="Página siguiente"
                    >
                      ›
                    </button>
                  </nav>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default Catalogo
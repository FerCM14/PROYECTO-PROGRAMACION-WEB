import { imagenEquipo } from '../../data/imagenes'
import { cambiarEstadoUnidadManual } from '../../data/EstadoUnidad'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import HeaderEncargado from '../Header/Header-Encargado'
import FooterEncargado from '../Footer/Footer-Encargado'
import Operacion from '../Extra/Operacion'
import { useCatalogo } from '../../context/catalogo/CatalogoContext'
import ModalEstadoUnidad from './ModalEstadoUnidad'
import './Inventario.css'

const ESTADOS = ['Disponible', 'Prestada', 'Mantenimiento', 'De baja']
const POR_PAGINA = 8
const RUTA_EDITAR = '/encargado/editar-equipo'
const RUTA_CONDICION = '/encargado/condicion-prestamo'

function contar(unidades) {
  const c = { Disponible: 0, Prestada: 0, Mantenimiento: 0, 'De baja': 0 }
  unidades.forEach((u) => {
    c[u.estado] = (c[u.estado] || 0) + 1
  })
  return c
}

function ResumenUnidades({ conteo }) {
  const partes = []
  if (conteo.Disponible) partes.push({ k: 'libres', t: `${conteo.Disponible} libres` })
  if (conteo.Prestada) partes.push({ k: 'prestadas', t: `${conteo.Prestada} ${conteo.Prestada === 1 ? 'prestada' : 'prestadas'}` })
  if (conteo.Mantenimiento) partes.push({ k: 'mant', t: `${conteo.Mantenimiento} mant.` })
  if (conteo['De baja']) partes.push({ k: 'baja', t: `${conteo['De baja']} de baja` })

  if (!partes.length) return <span className="inv-resumen__vacio">Sin unidades</span>

  return partes.map((p, i) => (
    <span key={p.k}>
      {i > 0 && <span className="inv-resumen__sep"> · </span>}
      <span className={`inv-resumen inv-resumen--${p.k}`}>{p.t}</span>
    </span>
  ))
}

function ModalEliminar({ producto, onCerrar, onConfirmar }) {
  const modal = useRef(null)

  useEffect(() => {
    const dialogo = modal.current
    dialogo.showModal()
    return () => dialogo.close()
  }, [])

  return (
    <dialog
      ref={modal}
      className="inv-modal inv-modal--eliminar"
      aria-labelledby="inv-eliminar-titulo"
      aria-describedby="inv-eliminar-detalle"
      onCancel={onCerrar}
    >
      <h2 id="inv-eliminar-titulo" className="inv-modal__titulo">Eliminar equipo</h2>
      <p id="inv-eliminar-detalle">¿Deseas eliminar «{producto.nombre}» del inventario?</p>
      <div className="inv-modal__acciones">
        <button type="button" className="inv-btn inv-btn--sec" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="inv-btn inv-btn--eliminar" onClick={onConfirmar}>Eliminar</button>
      </div>
    </dialog>
  )
}

export default function Inventario() {
  const { pathname, search, hash, state } = useLocation()
  const navigate = useNavigate()
  const { PRODUCTOS, CATEGORIAS, obtenerCategoria, obtenerProducto, eliminarProducto } = useCatalogo()
  const [seleccionado, setSeleccionado] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [categoria, setCategoria] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [reinicioCabecera, setReinicioCabecera] = useState(0)
  const [equipoPorEliminar, setEquipoPorEliminar] = useState(null)
  const [aviso, setAviso] = useState(() => state?.avisoEquipo ? { texto: state.avisoEquipo } : null)

  useEffect(() => {
    if (state?.avisoEquipo) {
      const resto = { ...state }
      delete resto.avisoEquipo
      navigate({ pathname, search, hash }, { replace: true, state: resto })
    }
  }, [state, pathname, search, hash, navigate])

  const filas = PRODUCTOS.map((p) => {
    const producto = obtenerProducto(p.id)
    return { producto, unidades: producto.unidades, conteo: contar(producto.unidades) }
  })

  function guardar(codigo, estado, nota) {
    const resultado = cambiarEstadoUnidadManual(codigo, estado, nota)
    if (!resultado.ok) return resultado
    setAviso({
      error: !resultado.ok,
      texto: resultado.ok ? `Se actualizó el estado de ${codigo}.` : `No se pudo guardar el estado de ${codigo}.`
    })
    setSeleccionado(null)
    return resultado
  }

  function buscar(codigo) {
    setBusqueda(codigo)
    setPagina(1)
  }

  function confirmarEliminacion() {
    const resultado = eliminarProducto(equipoPorEliminar.id)
    setAviso({
      error: !resultado.ok,
      texto: resultado.ok ? `Se eliminó «${equipoPorEliminar.nombre}» del inventario.` : resultado.motivo
    })
    setEquipoPorEliminar(null)
  }

  function limpiarFiltros() {
    setCategoria('')
    setEstadoFiltro('')
    buscar('')
    setReinicioCabecera((actual) => actual + 1)
  }

  const filaModal = seleccionado && filas.find((f) => f.producto.id === seleccionado)
  const totalUnidades = filas.reduce((a, f) => a + f.unidades.length, 0)

  const codigoBuscado = busqueda.replace(/\s+/g, '').toUpperCase()
  const filasFiltradas = filas.filter((f) =>
    (!categoria || f.producto.categoria === categoria) &&
    ((!estadoFiltro && !codigoBuscado) || f.unidades.some((u) =>
      (!estadoFiltro || u.estado === estadoFiltro) &&
      (!codigoBuscado || u.codigo.toUpperCase().includes(codigoBuscado))
    ))
  )

  const totalResultados = filasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(totalResultados / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  if (pagina !== paginaActual) setPagina(paginaActual)

  const inicio = (paginaActual - 1) * POR_PAGINA
  const filasPagina = filasFiltradas.slice(inicio, inicio + POR_PAGINA)
  const desde = totalResultados ? inicio + 1 : 0
  const hasta = inicio + filasPagina.length

  return (
    <div className="inv-pagina">
      <HeaderEncargado key={reinicioCabecera} onBuscar={buscar} />

      <div className="inv-cuerpo">
        <aside className="inv-lateral">
          <Operacion activo="inventario" />
        </aside>

        <main className="inv-contenido">
        <div className="inv-encabezado">
          <div>
            <h1 className="inv-titulo">Inventario de equipos</h1>
            <p className="inv-subtitulo">
              {filas.length} {filas.length === 1 ? 'modelo' : 'modelos'} · {totalUnidades}{' '}
              {totalUnidades === 1 ? 'unidad registrada' : 'unidades registradas'} en el Almacén H-102
            </p>
          </div>
          <Link to={RUTA_EDITAR} className="inv-btn inv-btn--pri inv-btn--link">
            Nuevo equipo
          </Link>
        </div>

        <div className="inv-filtros">
          <label htmlFor="inv-categoria">Categoría </label>
          <select
            id="inv-categoria"
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value)
              setPagina(1)
            }}
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <label htmlFor="inv-estado">Estado </label>
          <select
            id="inv-estado"
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value)
              setPagina(1)
            }}
          >
            <option value="">Todos</option>
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          <label htmlFor="inv-codigo">Código de inventario </label>
          <input
            id="inv-codigo"
            type="search"
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
          />
          <button type="button" className="inv-btn inv-btn--sec inv-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>

        {aviso && (
          <p className={`inv-aviso ${aviso.error ? 'inv-aviso--error' : ''}`} role={aviso.error ? 'alert' : 'status'}>
            {aviso.texto}
          </p>
        )}

        <div className="inv-tabla__marco">
          <table className="inv-tabla">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Equipo</th>
                <th>Marca y modelo</th>
                <th>Categoría</th>
                <th>Unidades por estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filasPagina.map(({ producto: p, conteo }) => (
                <tr key={p.id}>
                  <td>
                    <div className="inv-foto" aria-hidden="true">
                      <img src={imagenEquipo(p)} alt={p.nombre} />
                    </div>
                  </td>
                  <td className="inv-equipo">{p.nombre}</td>
                  <td className="inv-marca">
                    {p.marca} · {p.modelo}
                  </td>
                  <td>{obtenerCategoria(p.categoria)?.nombre || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="inv-celda-estados"
                      disabled={!conteo.Disponible && !conteo.Prestada && !conteo.Mantenimiento && !conteo['De baja']}
                      onClick={() => setSeleccionado(p.id)}
                      aria-label={`Cambiar estado de unidades de ${p.nombre}`}
                    >
                      <ResumenUnidades conteo={conteo} />
                    </button>
                  </td>
                  <td>
                    <span className="inv-acciones">
                      <Link to={`${RUTA_CONDICION}?id=${p.id}&pestana=unidades`}>Unidades</Link>
                      <span className="inv-acciones__sep"> · </span>
                      <Link to={`${RUTA_CONDICION}?id=${p.id}&pestana=condiciones`}>Condiciones</Link>
                      <span className="inv-acciones__sep"> · </span>
                      <Link to={`${RUTA_EDITAR}?id=${p.id}`}>Editar</Link>
                      <span className="inv-acciones__sep"> · </span>
                      <button
                        type="button"
                        className="inv-accion-eliminar"
                        aria-label={`Eliminar ${p.nombre}`}
                        onClick={() => {
                          setAviso(null)
                          setEquipoPorEliminar(p)
                        }}
                      >
                        Eliminar
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
              {!totalResultados && (
                <tr>
                  <td colSpan={6} className="inv-vacio">
                    {filas.length ? 'Ningún equipo coincide con estos filtros.' : 'No hay equipos registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="inv-pie">
            <span className="inv-pie__texto" role="status">
              Mostrando {desde} a {hasta} de {totalResultados} {totalResultados === 1 ? 'equipo' : 'equipos'}
            </span>
            <div className="inv-paginacion" role="navigation" aria-label="Paginación">
              <button
                type="button"
                className="inv-pag"
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                aria-label="Página anterior"
              >
                ‹
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`inv-pag ${n === paginaActual ? 'is-activo' : ''}`}
                  aria-current={n === paginaActual ? 'page' : undefined}
                  onClick={() => setPagina(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="inv-pag"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                aria-label="Página siguiente"
              >
                ›
              </button>
            </div>
          </div>
        </div>
        </main>
      </div>

      <FooterEncargado />

      {equipoPorEliminar && (
        <ModalEliminar
          producto={equipoPorEliminar}
          onCerrar={() => setEquipoPorEliminar(null)}
          onConfirmar={confirmarEliminacion}
        />
      )}

      {filaModal && filaModal.unidades.length > 0 && (
        <ModalEstadoUnidad
          key={filaModal.producto.id}
          producto={filaModal.producto}
          unidades={filaModal.unidades}
          onCerrar={() => setSeleccionado(null)}
          onGuardar={guardar}
        />
      )}
    </div>
  )
}

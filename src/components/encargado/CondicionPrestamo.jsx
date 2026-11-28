import { imagenEquipo } from '../../data/imagenes'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import HeaderEncargado from '../Header/Header-Encargado'
import FooterEncargado from '../Footer/Footer-Encargado'
import Operaciones from '../Extra/Operacion'
import { useCatalogo } from '../../context/catalogo/CatalogoContext'
import ModalEstadoUnidad from './ModalEstadoUnidad'
import { obtenerPrestamos } from '../../data/Identificacion'
import { obtenerTodasLasSolicitudes } from '../../data/Solicitudes'
import { normalizarDiasPrestamo } from '../../data/Producto'
import './CondicionPrestamo.css'

const UBICACIONES = [
  'Almacén H-102',
  'Almacén H-102 · anaquel 3',
  'Almacén N-005',
  'Lab. Electrónica H-210',
  'Servicio técnico externo'
]

const FORMATO_CODIGO = /^INV-[A-Z]{3}-\d{4}$/
const PESTANAS = [
  ['unidades', 'Unidades'],
  ['condiciones', 'Condiciones del préstamo'],
  ['historial', 'Historial']
]

function guardar(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

function formatearSoles(valor) {
  const numero = Number(valor)
  return `S/ ${(Number.isFinite(numero) ? numero : 0).toFixed(2)}`
}

export default function CondicionPrestamo() {
  const { obtenerProducto, obtenerCategoria } = useCatalogo()
  const [params, setParams] = useSearchParams()
  const id = params.get('id')
  const pestana = PESTANAS.find(([valor]) => valor === params.get('pestana'))?.[0] || 'unidades'
  const producto = obtenerProducto(id)
  if (!producto) {
    return (
      <div className="cp-pagina">
        <HeaderEncargado />
        <main className="cp-main">
          <h1>Equipo no encontrado</h1>
          <p>Selecciona un equipo del inventario para consultar sus unidades.</p>
          <Link to="/encargado/inventario">Volver al inventario</Link>
        </main>
        <FooterEncargado />
      </div>
    )
  }
  const categoria = obtenerCategoria(producto.categoria)?.nombre || producto.categoria
  function cambiarPestana(valor) {
    if (valor === pestana) return
    const siguientes = new URLSearchParams(params)
    siguientes.set('pestana', valor)
    setParams(siguientes)
  }

  return <CondicionEquipo key={producto.id} producto={producto} categoria={categoria} pestana={pestana} cambiarPestana={cambiarPestana} />
}

function CondicionEquipo({ producto, categoria, pestana, cambiarPestana }) {
  const { registrarUnidadProducto, cambiarEstadoUnidadManual, RECOJO } = useCatalogo()
  const CLAVE_CONDICIONES = `condiciones-${producto.id}`
  const [guardadas, setGuardadas] = useState(() => ({
    dias: producto.duracionMax,
    requiereAutorizacion: producto.autorizacion,
    admiteRenovacion: producto.renovable,
    penalizacion: producto.penalizacion
  }))
  const [condiciones, setCondiciones] = useState(guardadas)
  const unidades = producto.unidades.map((u) => ({ ...u, ubicacion: u.ubicacion || RECOJO.lugar }))
  const solicitudes = obtenerTodasLasSolicitudes()
  const tituloCondiciones = useRef(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (pestana === 'condiciones') tituloCondiciones.current?.focus({ preventScroll: true })
  }, [pestana])

  useEffect(() => {
    if (!mensaje) return undefined
    const id = setTimeout(() => setMensaje(''), 3000)
    return () => clearTimeout(id)
  }, [mensaje])

  const pendientes = solicitudes.filter((s) => s.estado === 'Enviada').length
  const prestamosVigentes = obtenerPrestamos().filter((p) => p.estado === 'Entregado')
  const prestamoPorUnidad = Object.fromEntries(prestamosVigentes.map((p) => [p.unidad, p.codigo]))
  const historial = solicitudes.filter((s) => unidades.some((u) => u.codigo === s.unidad))

  const hayCambios = JSON.stringify(condiciones) !== JSON.stringify(guardadas)
  const dias = normalizarDiasPrestamo(condiciones.dias)
  const errorDias = dias === undefined ? 'Ingresa un número entero de 1 a 30 días o deja el campo vacío.' : ''

  function cambiarCondicion(campo, valor) {
    setCondiciones((previo) => ({ ...previo, [campo]: valor }))
  }

  function descartar() {
    setCondiciones(guardadas)
  }

  function guardarCondiciones() {
    if (errorDias) return
    const penalizacion = Math.max(0, Number(condiciones.penalizacion) || 0)
    const nuevas = { ...condiciones, dias, penalizacion }
    guardar(CLAVE_CONDICIONES, nuevas)
    setGuardadas(nuevas)
    setCondiciones(nuevas)
    setMensaje('Condiciones guardadas')
  }

  function registrarUnidad({ codigo, ubicacion, observaciones }) {
    const resultado = registrarUnidadProducto(producto.id, { codigo, ubicacion, observaciones })
    if (!resultado.ok) return resultado
    setModalAbierto(false)
    setMensaje(`La unidad ${codigo} se registró como disponible.`)
    return resultado
  }

  function guardarEstado(codigo, estado, motivo) {
    const resultado = cambiarEstadoUnidadManual(codigo, estado, motivo)
    if (resultado.ok) {
      setMensaje(`Se actualizó el estado de ${codigo}.`)
      setUnidadSeleccionada(null)
    }
    return resultado
  }

  const textoRenovacion = condiciones.admiteRenovacion ? 'Admite renovación.' : 'No admite renovación.'
  const textoAutorizacion = condiciones.requiereAutorizacion
    ? 'Requiere la autorización del docente del curso asociado.'
    : 'No requiere autorización del docente.'

  return (
    <div className="cp-pagina">
      <HeaderEncargado solicitudesPendientes={pendientes} />

      <div className="cp-cuerpo">
        <Operaciones activo="inventario" solicitudesPendientes={pendientes} />

        <main className="cp-main">
          <nav className="cp-migas" aria-label="Ruta de navegación">
            <Link to="/encargado/inventario">Inventario</Link> / {categoria} / {producto.nombre}
          </nav>

          <header className="cp-equipo">
            <div className="cp-equipo-foto"><img src={imagenEquipo(producto)} alt={producto.nombre} /></div>
            <div className="cp-equipo-datos">
              <h1>{producto.nombre}</h1>
              <p>
                {producto.marca} · {producto.modelo} · {unidades.length}{' '}
                {unidades.length === 1 ? 'unidad registrada' : 'unidades registradas'}
                {' · '}{RECOJO.lugar}
              </p>
            </div>
            <div className="cp-equipo-acciones">
              <Link
                className="cp-btn cp-btn-secundario"
                to={`/encargado/editar-equipo?id=${producto.id}`}
              >
                Editar equipo
              </Link>
              <button
                type="button"
                className="cp-btn cp-btn-primario"
                onClick={() => setModalAbierto(true)}
              >
                Nueva unidad
              </button>
            </div>
          </header>

          <div className="cp-tabs" role="tablist" aria-label="Información del equipo">
            {PESTANAS.map(([id, texto]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`cp-tab-${id}`}
                aria-controls="cp-panel-equipo"
                aria-selected={pestana === id}
                className={`cp-tab ${pestana === id ? 'cp-tab-activa' : ''}`}
                onClick={() => cambiarPestana(id)}
              >
                {texto}
              </button>
            ))}
          </div>

          {mensaje && (
            <p className="cp-aviso" role="status">
              {mensaje}
            </p>
          )}

          <div id="cp-panel-equipo" role="tabpanel" aria-labelledby={`cp-tab-${pestana}`}>
          {unidades.length === 0 && pestana === 'unidades' ? (
            <EstadoVacio onNueva={() => setModalAbierto(true)} />
          ) : (
            <div className="cp-contenido">
              {pestana === 'historial' ? (
                <TablaHistorial historial={historial} />
              ) : unidades.length > 0 ? (
                <TablaUnidades unidades={unidades} prestamos={prestamoPorUnidad} onCambiarEstado={setUnidadSeleccionada} />
              ) : (
                <EstadoVacio onNueva={() => setModalAbierto(true)} />
              )}

              {pestana !== 'historial' && (
                <aside className="cp-condiciones">
                  <h2 ref={tituloCondiciones} tabIndex={-1}>2.5 Condiciones del préstamo</h2>
                  <p className="cp-condiciones-sub">Pestaña del mismo equipo</p>

                  <div className="cp-condiciones-grid">
                    <div className="cp-campos">
                      <label className="cp-etiqueta" htmlFor="cp-dias">
                        Duración máxima
                      </label>
                      <div className="cp-dias">
                        <input
                          id="cp-dias"
                          type="text"
                          inputMode="numeric"
                          className={`cp-input cp-input-corto ${errorDias ? 'cp-input-error' : ''}`}
                          value={condiciones.dias ?? ''} placeholder="Sin límite"
                          aria-invalid={Boolean(errorDias)}
                          aria-describedby={errorDias ? 'cp-dias-ayuda cp-dias-error' : 'cp-dias-ayuda'}
                          onChange={(e) => cambiarCondicion('dias', e.target.value)}
                        />
                        <span>días calendario</span>
                      </div>
                      <small id="cp-dias-ayuda" className="cp-ayuda">Deja el campo vacío para prestar sin límite.</small>
                      {errorDias && <small id="cp-dias-error" className="cp-ayuda cp-ayuda-error">{errorDias}</small>}

                      <Interruptor
                        id="cp-autorizacion"
                        marcado={condiciones.requiereAutorizacion}
                        onCambio={(v) => cambiarCondicion('requiereAutorizacion', v)}
                        texto="Requiere autorización del docente"
                      />
                      <Interruptor
                        id="cp-renovacion"
                        marcado={condiciones.admiteRenovacion}
                        onCambio={(v) => cambiarCondicion('admiteRenovacion', v)}
                        texto="Admite renovación"
                      />

                      <label className="cp-etiqueta" htmlFor="cp-penalizacion">
                        Penalidad por día
                      </label>
                      <input
                        id="cp-penalizacion"
                        type="number"
                        min="0"
                        step="0.5"
                        className="cp-input"
                        value={condiciones.penalizacion}
                        onChange={(e) => cambiarCondicion('penalizacion', e.target.value)}
                      />
                    </div>

                    <div className="cp-vista">
                      <span className="cp-etiqueta">Vista previa para el estudiante</span>
                      <div className="cp-vista-caja">
                        <strong>Condiciones de este equipo</strong>
                        <p>
                          Préstamo <b>{condiciones.dias == null || condiciones.dias === '' ? 'sin límite de días' : `de hasta ${condiciones.dias} días calendario`}</b>.{' '}
                          {textoAutorizacion} <b>{textoRenovacion}</b> El retraso genera una penalidad
                          de {formatearSoles(condiciones.penalizacion)} por día.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="cp-condiciones-acciones">
                    <button
                      type="button"
                      className="cp-btn cp-btn-secundario"
                      onClick={descartar}
                      disabled={!hayCambios}
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      className="cp-btn cp-btn-primario"
                      onClick={guardarCondiciones}
                      disabled={!hayCambios || Boolean(errorDias)}
                    >
                      Guardar condiciones
                    </button>
                  </div>
                </aside>
              )}
            </div>
          )}
          </div>
        </main>
      </div>

      <FooterEncargado />

      {unidadSeleccionada && (
        <ModalEstadoUnidad
          key={unidadSeleccionada}
          producto={producto}
          unidades={unidades.filter((u) => u.codigo === unidadSeleccionada)}
          codigoInicial={unidadSeleccionada}
          onCerrar={() => setUnidadSeleccionada(null)}
          onGuardar={guardarEstado}
        />
      )}
      {modalAbierto && (
        <ModalAltaUnidad
          nombreEquipo={producto.nombre}
          onCancelar={() => setModalAbierto(false)}
          onRegistrar={registrarUnidad}
        />
      )}
    </div>
  )
}

/* ---------- Subcomponentes ---------- */

function Interruptor({ id, marcado, onCambio, texto }) {
  return (
    <label className="cp-interruptor" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={marcado}
        onChange={(e) => onCambio(e.target.checked)}
      />
      <span className="cp-interruptor-pista" aria-hidden="true" />
      <span className="cp-interruptor-texto">{texto}</span>
    </label>
  )
}

function Estado({ estado }) {
  const clase = estado.toLowerCase().replaceAll(' ', '-')
  return <span className={`cp-estado cp-estado-${clase}`}>{estado}</span>
}

function TablaUnidades({ unidades, prestamos, onCambiarEstado }) {
  return (
    <div className="cp-tabla-caja">
      <table className="cp-tabla cp-tabla-unidades" aria-label="Unidades del equipo">
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Ubicación</th>
            <th scope="col">Estado</th>
            <th scope="col">Observaciones</th>
            <th scope="col">Préstamo vigente</th>
            <th scope="col">Acción</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map((u) => (
            <tr key={u.codigo}>
              <th scope="row" className="cp-codigo">{u.codigo}</th>
              <td className="cp-suave">{u.ubicacion}</td>
              <td>
                <Estado estado={u.estado} />
              </td>
              <td className="cp-suave cp-observaciones">
                {String(u.observaciones ?? '').trim() || '—'}
                {u.nota && <small className="cp-nota-estado">Nota de estado: {u.nota}</small>}
              </td>
              <td className="cp-codigo">{prestamos[u.codigo] || '—'}</td>
              <td><button type="button" className="cp-btn cp-btn-secundario" aria-label={`Cambiar estado de ${u.codigo}`} onClick={() => onCambiarEstado(u.codigo)}>Cambiar estado</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TablaHistorial({ historial }) {
  if (historial.length === 0) {
    return (
      <div className="cp-tabla-caja cp-historial-vacio">
        Aún no hay solicitudes asociadas a las unidades de este equipo.
      </div>
    )
  }

  return (
    <div className="cp-tabla-caja cp-tabla-ancha">
      <table className="cp-tabla">
        <thead>
          <tr>
            <th>Solicitud</th>
            <th>Unidad</th>
            <th>Estudiante</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((s) => (
            <tr key={s.codigo}>
              <td className="cp-codigo">{s.codigo}</td>
              <td className="cp-codigo">{s.unidad}</td>
              <td className="cp-suave">{s.correo}</td>
              <td>{s.estado}</td>
              <td className="cp-suave">{s.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EstadoVacio({ onNueva }) {
  return (
    <section className="cp-vacio" aria-live="polite">
      <button type="button" className="cp-vacio-mas" onClick={onNueva} aria-label="Registrar unidad">
        +
      </button>
      <h2>Este equipo aún no tiene unidades</h2>
      <p>Registra al menos una unidad con su código de inventario para que el equipo pueda aparecer en el catálogo.</p>
    </section>
  )
}

function ModalAltaUnidad({ nombreEquipo, onCancelar, onRegistrar }) {
  const [codigo, setCodigo] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [errorUbicacion, setErrorUbicacion] = useState('')
  const [errorRegistro, setErrorRegistro] = useState('')
  const campoCodigo = useRef(null)
  const dialogo = useRef(null)

  useEffect(() => {
    const modal = dialogo.current
    modal.showModal()
    campoCodigo.current?.focus()
    return () => modal.close()
  }, [])

  function enviar(e) {
    e.preventDefault()
    setErrorRegistro('')
    const limpio = codigo.replace(/\s+/g, '').toUpperCase()
    const ubicacionValida = UBICACIONES.includes(ubicacion)
    setErrorUbicacion(ubicacionValida ? '' : 'Selecciona una ubicación de la lista.')

    if (!limpio) {
      setError('Ingresa el código de inventario.')
      return
    }
    if (!FORMATO_CODIGO.test(limpio)) {
      setError('Usa INV-, tres letras y cuatro dígitos. Ejemplo: INV-OSC-0042.')
      return
    }
    if (!ubicacionValida) return

    const resultado = onRegistrar({ codigo: limpio, ubicacion, observaciones: observaciones.trim() })
    if (resultado.motivo === 'codigo-duplicado') {
      setError('Ya existe una unidad con ese código en el almacén.')
    } else if (resultado.motivo === 'equipo-inexistente') {
      setErrorRegistro('El equipo ya no está en el inventario.')
    } else if (!resultado.ok) {
      setErrorRegistro('No se pudo guardar la unidad en este navegador. Inténtalo de nuevo.')
    }
  }

  return (
    <dialog
      ref={dialogo}
      className="cp-modal cp-modal-alta"
      aria-labelledby="cp-modal-titulo"
      aria-describedby="cp-modal-equipo"
      onCancel={onCancelar}
    >
      <form onSubmit={enviar} noValidate>
        <h2 id="cp-modal-titulo">Nueva unidad</h2>
        <p id="cp-modal-equipo" className="cp-modal-equipo">{nombreEquipo}</p>

        <div className="cp-modal-fila">
          <div className="cp-modal-campo">
            <label className="cp-etiqueta" htmlFor="cp-codigo">
              Código de inventario
            </label>
            <input
              id="cp-codigo"
              ref={campoCodigo}
              className={`cp-input cp-codigo ${error ? 'cp-input-error' : ''}`}
              placeholder="INV-OSC-0047"
              autoComplete="off"
              value={codigo}
              required
              aria-invalid={Boolean(error)}
              aria-describedby="cp-codigo-ayuda"
              onChange={(e) => {
                setCodigo(e.target.value)
                setError('')
              }}
            />
            <small id="cp-codigo-ayuda" className={error ? 'cp-ayuda cp-ayuda-error' : 'cp-ayuda'}>
              {error || 'Formato INV-XXX-0000, único en el almacén.'}
            </small>
          </div>

          <div className="cp-modal-campo">
            <label className="cp-etiqueta" htmlFor="cp-ubicacion">
              Ubicación
            </label>
            <select
              id="cp-ubicacion"
              className={`cp-input ${errorUbicacion ? 'cp-input-error' : ''}`}
              value={ubicacion}
              required
              aria-invalid={Boolean(errorUbicacion)}
              aria-describedby={errorUbicacion ? 'cp-ubicacion-error' : undefined}
              onChange={(e) => {
                setUbicacion(e.target.value)
                setErrorUbicacion('')
              }}
            >
              <option value="" disabled>Selecciona una ubicación</option>
              {UBICACIONES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {errorUbicacion && <small id="cp-ubicacion-error" className="cp-ayuda cp-ayuda-error">{errorUbicacion}</small>}
          </div>
        </div>

        <div className="cp-modal-campo cp-modal-observaciones">
          <label className="cp-etiqueta" htmlFor="cp-observaciones">Observaciones (opcional)</label>
          <textarea
            id="cp-observaciones"
            className="cp-input"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        {errorRegistro && <p className="cp-aviso cp-aviso--registro-error" role="alert">{errorRegistro}</p>}
        <div className="cp-modal-acciones">
          <button type="button" className="cp-btn cp-btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="cp-btn cp-btn-primario">
            Registrar unidad
          </button>
        </div>
      </form>
    </dialog>
  )
}

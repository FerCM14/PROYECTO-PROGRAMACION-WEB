import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operaciones from '../../components/Extra/Operacion'
import { PRODUCTOS, obtenerProducto, obtenerCategoria, registrarUnidadProducto, cambiarEstadoUnidad } from '../../data/Producto'
import { obtenerPrestamos } from '../../data/Identificacion'
import { useActualizacion } from '../../data/Actualizacion'
import { obtenerTodasLasSolicitudes } from '../../data/Solicitudes'
import './CondicionPrestamo.css'

const UBICACIONES = [
  'Almacén H-102',
  'Almacén H-102 · anaquel 3',
  'Almacén N-005',
  'Lab. Electrónica H-210',
  'Servicio técnico externo'
]

const FORMATO_CODIGO = /^INV-[A-Z]{3}-\d{4}$/

function leer(clave, porDefecto) {
  try {
    const dato = JSON.parse(localStorage.getItem(clave))
    return dato ?? porDefecto
  } catch {
    return porDefecto
  }
}

function guardar(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

function formatearSoles(valor) {
  const numero = Number(valor)
  return `S/ ${(Number.isFinite(numero) ? numero : 0).toFixed(2)}`
}

export default function CondicionPrestamo() {
  const [params] = useSearchParams()
  const id = params.get('id') || PRODUCTOS[0]?.id
  const producto = obtenerProducto(id)
  if (!producto) return <div className="cp-pagina"><HeaderEncargado /><main className="cp-main"><h1>Equipo no encontrado</h1></main><FooterEncargado /></div>
  return <CondicionEquipo key={producto.id} producto={producto} />
}

function CondicionEquipo({ producto }) {
  useActualizacion()
  const navigate = useNavigate()
  const EQUIPO = { ...producto, categoria: obtenerCategoria(producto.categoria)?.nombre || producto.categoria }
  const CLAVE_CONDICIONES = `condiciones-${producto.id}`
  const [guardadas, setGuardadas] = useState(() => leer(CLAVE_CONDICIONES, { dias:producto.duracionMax, requiereAutorizacion:producto.autorizacion, admiteRenovacion:producto.renovable, penalizacion:producto.penalizacion ?? 15 }))
  const [condiciones, setCondiciones] = useState(guardadas)
  const unidades = obtenerProducto(producto.id).unidades.map((u) => ({...u, ubicacion:u.ubicacion || 'Almacén H-102', observaciones:u.observaciones || u.nota || ''}))
  const solicitudes = obtenerTodasLasSolicitudes()
  const [pestana, setPestana] = useState('unidades')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [baja, setBaja] = useState(null)
  const [motivoBaja, setMotivoBaja] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!mensaje) return undefined
    const id = setTimeout(() => setMensaje(''), 3000)
    return () => clearTimeout(id)
  }, [mensaje])

  const pendientes = solicitudes.filter((s) => s.estado === 'Enviada').length
  const prestamoPorUnidad = Object.fromEntries(obtenerPrestamos().filter((p) => p.estado === 'Entregado').map((p) => [p.unidad,p.codigo]))
  const historial = solicitudes.filter((s) => unidades.some((u) => u.codigo === s.unidad))

  const hayCambios = JSON.stringify(condiciones) !== JSON.stringify(guardadas)

  function cambiarCondicion(campo, valor) {
    setCondiciones((previo) => ({ ...previo, [campo]: valor }))
  }

  function descartar() {
    setCondiciones(guardadas)
  }

  function guardarCondiciones() {
    const dias = condiciones.dias === '' || condiciones.dias === null ? null : Math.min(30, Math.max(1, Number(condiciones.dias) || 1))
    const penalizacion = Math.max(0, Number(condiciones.penalizacion) || 0)
    const nuevas = { ...condiciones, dias, penalizacion }
    guardar(CLAVE_CONDICIONES, nuevas)
    setGuardadas(nuevas)
    setCondiciones(nuevas)
    setMensaje('Condiciones guardadas')
  }

  function registrarUnidad({ codigo, ubicacion }) {
    const resultado = registrarUnidadProducto(producto.id, { codigo, ubicacion })
    if (!resultado.ok) { setMensaje('No se pudo registrar: el código ya existe.'); return }
    setModalAbierto(false)
    setMensaje(`Unidad ${codigo} registrada`)
  }

  function confirmarBaja(e) {
    e.preventDefault()
    if (obtenerPrestamos().some((p) => p.unidad === baja.codigo && p.estado !== 'Devuelto')) { setMensaje('No se puede dar de baja una unidad con un préstamo pendiente.'); setBaja(null); return }
    cambiarEstadoUnidad(baja.codigo, 'De baja', motivoBaja.trim())
    setBaja(null)
    setMensaje('Unidad dada de baja. Se registró el motivo en el inventario.')
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
            Inventario / {EQUIPO.categoria} / {EQUIPO.nombre}
          </nav>

          <header className="cp-equipo">
            <div className="cp-equipo-foto" aria-hidden="true" />
            <div className="cp-equipo-datos">
              <h1>{EQUIPO.nombre}</h1>
              <p>
                {EQUIPO.marca} · {EQUIPO.modelo} · {unidades.length}{' '}
                {unidades.length === 1 ? 'unidad registrada' : 'unidades registradas'} · Almacén H-102
              </p>
              <p>{producto.descripcion}</p>
              <p>Accesorios: {producto.accesorios.join(', ') || 'Sin accesorios registrados'}</p>
            </div>
            <div className="cp-equipo-acciones">
              <button
                type="button"
                className="cp-btn cp-btn-secundario"
                onClick={() => navigate(`/encargado/editar-equipo?id=${producto.id}`)}
              >
                Editar equipo
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-primario"
                onClick={() => setModalAbierto(true)}
              >
                Nueva unidad
              </button>
            </div>
          </header>

          <div className="cp-tabs" role="tablist">
            {[
              ['unidades', 'Unidades'],
              ['condiciones', 'Condiciones del préstamo'],
              ['historial', 'Historial']
            ].map(([id, texto]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={pestana === id}
                className={`cp-tab ${pestana === id ? 'cp-tab-activa' : ''}`}
                onClick={() => setPestana(id)}
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

          {unidades.length === 0 ? (
            <EstadoVacio onNueva={() => setModalAbierto(true)} />
          ) : (
            <div className="cp-contenido">
              {pestana === 'historial' ? (
                <TablaHistorial historial={historial} />
              ) : (
                <TablaUnidades unidades={unidades} prestamos={prestamoPorUnidad} onBaja={(u) => { setBaja(u); setMotivoBaja('') }} />
              )}

              {pestana !== 'historial' && (
                <aside className="cp-condiciones">
                  <h2>2.5 Condiciones del préstamo</h2>
                  <p className="cp-condiciones-sub">Pestaña del mismo equipo</p>

                  <div className="cp-condiciones-grid">
                    <div className="cp-campos">
                      <label className="cp-etiqueta" htmlFor="cp-dias">
                        Duración máxima
                      </label>
                      <div className="cp-dias">
                        <input
                          id="cp-dias"
                          type="number"
                          min="1"
                          max="30"
                          className="cp-input cp-input-corto"
                          value={condiciones.dias ?? ''} placeholder="Sin límite"
                          onChange={(e) => cambiarCondicion('dias', e.target.value)}
                        />
                        <span>días calendario</span>
                      </div>

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
                      disabled={!hayCambios}
                    >
                      Guardar condiciones
                    </button>
                  </div>
                </aside>
              )}
            </div>
          )}
        </main>
      </div>

      <FooterEncargado />

      {baja && <div className="cp-overlay"><form className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-baja-titulo" onSubmit={confirmarBaja}><h2 id="cp-baja-titulo">Dar de baja unidad</h2><p>{producto.nombre} · Modelo {producto.modelo} · {baja.codigo}</p><label className="cp-modal-campo">Motivo de baja<textarea autoFocus required className="cp-input" value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} /></label><div className="cp-modal-acciones"><button type="button" className="cp-btn cp-btn-secundario" onClick={() => setBaja(null)}>Cancelar</button><button type="submit" className="cp-btn cp-btn-peligro" disabled={!motivoBaja.trim()}>Dar de baja</button></div></form></div>}
      {modalAbierto && (
        <ModalAltaUnidad
          existentes={unidades.map((u) => u.codigo)}
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

function TablaUnidades({ unidades, prestamos, onBaja }) {
  return (
    <div className="cp-tabla-caja">
      <table className="cp-tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Observaciones</th>
            <th>Préstamo vigente</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map((u) => (
            <tr key={u.codigo}>
              <td className="cp-codigo">{u.codigo}</td>
              <td className="cp-suave">{u.ubicacion}</td>
              <td>
                <Estado estado={u.estado} />
              </td>
              <td className="cp-suave">{u.observaciones || '—'}</td>
              <td className="cp-codigo">{prestamos[u.codigo] || '—'}</td><td><button type="button" className="cp-btn cp-btn-secundario" disabled={u.estado === 'De baja'} onClick={() => onBaja(u)}>Dar de baja</button></td>
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
      <p>Registra al menos una unidad con su código de inventario para que aparezca en el catálogo.</p>
    </section>
  )
}

function ModalAltaUnidad({ existentes, onCancelar, onRegistrar }) {
  const [codigo, setCodigo] = useState('')
  const [ubicacion, setUbicacion] = useState(UBICACIONES[0])
  const [error, setError] = useState('')
  const campoCodigo = useRef(null)

  useEffect(() => {
    campoCodigo.current?.focus()
    function alTeclear(e) {
      if (e.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCancelar])

  function enviar(e) {
    e.preventDefault()
    const limpio = codigo.trim().toUpperCase()

    if (!FORMATO_CODIGO.test(limpio)) {
      setError('El código debe tener el formato INV-XXX-0000.')
      return
    }
    if (existentes.includes(limpio)) {
      setError('Ya existe una unidad con ese código en el almacén.')
      return
    }
    onRegistrar({ codigo: limpio, ubicacion })
  }

  return (
    <div className="cp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancelar()}>
      <form className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-modal-titulo" onSubmit={enviar} noValidate>
        <h2 id="cp-modal-titulo">Nueva unidad</h2>

        <div className="cp-modal-fila">
          <div className="cp-modal-campo">
            <label className="cp-etiqueta" htmlFor="cp-codigo">
              Código de inventario
            </label>
            <input
              id="cp-codigo"
              ref={campoCodigo}
              className={`cp-input ${error ? 'cp-input-error' : ''}`}
              placeholder="INV-OSC-0047"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value)
                setError('')
              }}
            />
            <small className={error ? 'cp-ayuda cp-ayuda-error' : 'cp-ayuda'}>
              {error || 'Formato INV-XXX-0000, único en el almacén.'}
            </small>
          </div>

          <div className="cp-modal-campo">
            <label className="cp-etiqueta" htmlFor="cp-ubicacion">
              Ubicación
            </label>
            <select
              id="cp-ubicacion"
              className="cp-input"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            >
              {UBICACIONES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cp-modal-acciones">
          <button type="button" className="cp-btn cp-btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="cp-btn cp-btn-primario">
            Registrar unidad
          </button>
        </div>
      </form>
    </div>
  )
}
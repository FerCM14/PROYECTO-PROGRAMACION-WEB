import { useEffect, useRef, useState } from 'react'
import { consultarPrestamosUnidad, consultarReservasUnidad, errorTransicionManual } from '../../data/EstadoUnidad'
import './Inventario.css'

const ESTADOS = [
  { valor: 'Disponible', etiqueta: 'Disponible', clase: 'disponible' },
  { valor: 'Mantenimiento', etiqueta: 'En mantenimiento', clase: 'mantenimiento' },
  { valor: 'De baja', etiqueta: 'Dada de baja', clase: 'baja' }
]

function fechasReservas(reservas) {
  return [...new Set(reservas.map((r) => {
    const fecha = (dia) => dia.split('-').reverse().join('/')
    return r.desde === r.hasta ? fecha(r.desde) : `${fecha(r.desde)} al ${fecha(r.hasta)}`
  }))].join(', ')
}

export default function ModalEstadoUnidad({ producto, unidades, codigoInicial, onCerrar, onGuardar }) {
  const [codigo, setCodigo] = useState(codigoInicial || unidades[0]?.codigo || '')
  const unidad = unidades.find((u) => u.codigo === codigo)
  const [estado, setEstado] = useState(unidad?.estado || 'Disponible')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')
  const [confirmandoBaja, setConfirmandoBaja] = useState(false)
  const dialogo = useRef(null)
  const bloqueada = unidad?.estado === 'Prestada' || unidad?.estado === 'De baja'
  const motivoObligatorio = estado === 'Mantenimiento' || estado === 'De baja'
  let prestamos = []
  let errorConsulta = false
  let reservas = { directas: [], porModelo: [] }
  let errorReservas = false
  const retiraUnidad = estado === 'Mantenimiento' || estado === 'De baja'
  try {
    if (unidad) prestamos = consultarPrestamosUnidad(unidad.codigo)
  } catch {
    errorConsulta = true
  }
  try {
    if (unidad) reservas = consultarReservasUnidad(producto, unidad)
  } catch {
    errorReservas = true
  }
  const reservaComprometida = reservas.directas.length > 0 || reservas.porModelo.length > 0

  const guardarDeshabilitado = !unidad || errorConsulta || prestamos.length > 0 ||
    (retiraUnidad && (reservaComprometida || errorReservas)) ||
    Boolean(errorTransicionManual(unidad?.estado, estado))

  useEffect(() => {
    const modal = dialogo.current
    modal.showModal()
    return () => modal.close()
  }, [])

  function elegirUnidad(nuevoCodigo) {
    const u = unidades.find((x) => x.codigo === nuevoCodigo)
    setCodigo(nuevoCodigo)
    setEstado(u?.estado || 'Disponible')
    setNota('')
    setError('')
    setErrorMotivo('')
    setConfirmandoBaja(false)
  }

  function guardar(evento) {
    evento.preventDefault()
    if (guardarDeshabilitado) return
    setError('')
    if (estado === 'De baja' && !confirmandoBaja) {
      if (!nota.trim()) {
        setErrorMotivo('Ingresa un motivo para el cambio de estado.')
        return
      }
      setConfirmandoBaja(true)
      return
    }

    const resultado = onGuardar(codigo, estado, nota)
    if (resultado.campo === 'motivo') setErrorMotivo(resultado.mensaje)
    else if (!resultado.ok) setError(resultado.mensaje)
  }

  return (
    <dialog ref={dialogo} className="inv-modal inv-modal--estado" aria-labelledby="inv-modal-titulo" onCancel={onCerrar}>
      <form onSubmit={guardar}>
        <h2 id="inv-modal-titulo" className="inv-modal__titulo">Cambiar estado de la unidad</h2>
        <p className="inv-modal__sub">{producto.nombre} · <strong>{unidad?.codigo || codigo}</strong></p>

        {!codigoInicial && (
          <>
            <label className="inv-modal__label" htmlFor="inv-unidad">Unidad</label>
            <select
              id="inv-unidad"
              className="inv-modal__select"
              value={codigo}
              onChange={(e) => elegirUnidad(e.target.value)}
            >
              {unidades.map((u) => <option key={u.codigo} value={u.codigo}>{u.codigo}</option>)}
            </select>
          </>
        )}

        <p className="inv-modal__label">
          {unidad ? `Estado actual: ${ESTADOS.find((opcion) => opcion.valor === unidad.estado)?.etiqueta || unidad.estado}` : 'La unidad seleccionada ya no está disponible en el inventario.'}
        </p>
        <div className="inv-modal__estados" role="radiogroup" aria-label="Nuevo estado">
          {ESTADOS.map(({ valor, etiqueta, clase }) => (
            <label key={valor} className={`inv-modal__estado inv-modal__estado--${clase} ${estado === valor ? 'is-activo' : ''}`}>
              <input
                type="radio"
                name="inv-nuevo-estado"
                checked={estado === valor}
                disabled={!unidad || Boolean(errorTransicionManual(unidad.estado, valor))}
                onChange={() => { setEstado(valor); setError(''); setErrorMotivo(''); setConfirmandoBaja(false) }}
              />
              {etiqueta}
            </label>
          ))}
        </div>
        {bloqueada && <p className="inv-modal__label">{errorTransicionManual(unidad.estado, 'Disponible')}</p>}
        {(prestamos.length > 0 || reservaComprometida) && (
          <aside className="inv-modal__advertencia" aria-label="Compromisos de la unidad">
            {prestamos.length > 0 && (
              <p>Préstamos comprometidos: <strong>{prestamos.map((p) => p.codigo).join(', ')}</strong>. Resuélvelos antes de cambiar el estado.</p>
            )}
            {reservas.directas.length > 0 && (
              <p>Reservas asignadas a esta unidad: <strong>{reservas.directas.length}</strong> ({fechasReservas(reservas.directas)}).</p>
            )}
            {reservas.porModelo.length > 0 && (
              <p>Reservas del modelo que perderían cupo al retirar esta unidad: <strong>{reservas.porModelo.length}</strong> ({fechasReservas(reservas.porModelo)}).</p>
            )}
            {reservaComprometida && <p>Los compromisos de reserva bloquean el cambio a mantenimiento o baja.</p>}
          </aside>
        )}
        {errorConsulta && <p role="alert">No se pudieron verificar los préstamos de esta unidad.</p>}
        {retiraUnidad && errorReservas && <p role="alert">No se pudieron verificar las reservas de este equipo.</p>}

        <label className="inv-modal__label" htmlFor="inv-nota">
          Motivo del cambio{motivoObligatorio ? ' (obligatorio)' : ' (opcional)'}
        </label>
        <textarea
          id="inv-nota"
          className="inv-modal__nota"
          rows={2}
          value={nota}
          aria-invalid={Boolean(errorMotivo)}
          aria-required={motivoObligatorio && !bloqueada}
          aria-describedby={errorMotivo ? 'inv-error-motivo' : undefined}
          disabled={!unidad || bloqueada}
          onChange={(e) => { setNota(e.target.value); setErrorMotivo(''); setConfirmandoBaja(false) }}
          placeholder="Ej.: lente con hongos; enviada al servicio técnico."
        />
        {errorMotivo && <p id="inv-error-motivo" className="inv-modal__error" role="alert">{errorMotivo}</p>}
        {confirmandoBaja && (
          <div className="inv-modal__confirmacion" role="status">
            <strong>¿Confirmas la baja definitiva?</strong>
            <p>La unidad {codigo} de {producto.nombre} dejará de estar disponible para nuevos préstamos.</p>
          </div>
        )}

        {error && <p className="inv-modal__error" role="alert">{error}</p>}
        <div className="inv-modal__acciones">
          <button type="button" className="inv-btn inv-btn--sec" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="submit"
            className={`inv-btn ${confirmandoBaja ? 'inv-btn--eliminar' : 'inv-btn--pri'}`}
            disabled={guardarDeshabilitado}
          >
            {confirmandoBaja ? 'Confirmar baja' : 'Guardar estado'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

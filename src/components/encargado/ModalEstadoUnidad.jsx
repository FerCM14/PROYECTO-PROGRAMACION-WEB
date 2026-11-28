import { useEffect, useState } from 'react'
import './Inventario.css'

const ESTADOS = [
  { valor: 'Disponible', etiqueta: 'Disponible', clase: 'disponible' },
  { valor: 'Mantenimiento', etiqueta: 'En mantenimiento', clase: 'mantenimiento' },
  { valor: 'De baja', etiqueta: 'Dada de baja', clase: 'baja' }
]

export default function ModalEstadoUnidad({ producto, unidades, codigoInicial, onCerrar, onGuardar }) {
  const [codigo, setCodigo] = useState(codigoInicial || unidades[0]?.codigo || '')
  const unidad = unidades.find((u) => u.codigo === codigo)
  const [estado, setEstado] = useState(unidad?.estado || 'Disponible')
  const [nota, setNota] = useState('')

  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  function elegirUnidad(nuevoCodigo) {
    const u = unidades.find((x) => x.codigo === nuevoCodigo)
    setCodigo(nuevoCodigo)
    setEstado(u?.estado || 'Disponible')
    setNota('')
  }

  return (
    <div className="inv-modal__fondo" onClick={onCerrar}>
      <div
        className="inv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inv-modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
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
          {unidades.map((u) => (
            <option key={u.codigo} value={u.codigo}>
              {u.codigo}
            </option>
          ))}
        </select>
          </>
        )}

        <p className="inv-modal__label">
          {unidad ? `Estado actual: ${ESTADOS.find((opcion) => opcion.valor === unidad.estado)?.etiqueta || unidad.estado}` : 'La unidad seleccionada ya no está disponible en el inventario.'}
        </p>
        <div className="inv-modal__estados" role="radiogroup" aria-label="Nuevo estado">
          {ESTADOS.map(({ valor, etiqueta, clase }) => (
            <label key={valor} className={`inv-modal__estado inv-modal__estado--${clase} ${estado === valor ? 'is-activo' : ''}`}>
              <input type="radio" name="inv-nuevo-estado" checked={estado === valor} onChange={() => setEstado(valor)} />
              {etiqueta}
            </label>
          ))}
        </div>

        <label className="inv-modal__label" htmlFor="inv-nota">Motivo (opcional)</label>
        <textarea
          id="inv-nota"
          className="inv-modal__nota"
          rows={2}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej.: lente con hongos; enviada al servicio técnico."
        />

        <div className="inv-modal__acciones">
          <button type="button" className="inv-btn inv-btn--sec" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="inv-btn inv-btn--pri"
            disabled={!unidad}
            onClick={() => onGuardar(codigo, estado, nota)}
          >
            Guardar estado
          </button>
        </div>
      </div>
    </div>
  )
}

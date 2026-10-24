import { useActualizacion } from '../../data/Actualizacion'
// src/pages/encargado/Metricas.jsx
// Tablero del almacén: métricas por rango de fechas y exportación a CSV.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { hoyISO, formatearFecha } from '../../data/fechas'
import { COLORES, almacenActual, calcularMetricas, exportarCSV, obtenerPeriodoMetricas, guardarPeriodoMetricas } from '../../data/Metricas'
import './Metricas.css'

// Ajusta estas rutas a las de tu proyecto
const RUTAS = {
  inventario: '/encargado/inventario',
  solicitudes: '/encargado/aprobacion-entrega',
  prestamos: '/encargado/prestamos-vigentes',
  vencidos: '/encargado/prestamos-vigentes?vencidos=1',
  devoluciones: '/encargado/devoluciones'
}

function soles(monto) {
  return `S/ ${monto.toFixed(2)}`
}

function Metricas() {
  useActualizacion()
  const navigate = useNavigate()
  const inicial = useMemo(() => obtenerPeriodoMetricas(), [])
  const almacen = useMemo(() => almacenActual(), [])

  const [desde, setDesde] = useState(inicial.desde)
  const [hasta, setHasta] = useState(inicial.hasta)
  const [mensaje, setMensaje] = useState('')
  useEffect(() => { guardarPeriodoMetricas({desde,hasta}) }, [desde,hasta])

  const rangoValido = Boolean(desde) && Boolean(hasta) && desde <= hasta
  const errorRango =
    !desde || !hasta
      ? 'Elige la fecha inicial y la final.'
      : desde > hasta
        ? 'La fecha inicial no puede ser posterior a la final.'
        : ''

  const m = rangoValido ? calcularMetricas({ desde, hasta, almacen }) : null

  const exportar = () => {
    if (!m) return
    const nombre = exportarCSV(m, { almacen, desde, hasta })
    setMensaje(`Se descargó ${nombre} en tu computadora.`)
  }

  const cambiarDesde = (valor) => {
    setDesde(valor)
    setMensaje('')
  }

  const cambiarHasta = (valor) => {
    setHasta(valor)
    setMensaje('')
  }

  const maximoBarras = m ? Math.max(1, ...m.barras.map((b) => b.total)) : 1

  const variacionTexto =
    !m || m.variacion === null
      ? 'sin datos del periodo anterior'
      : `${m.variacion > 0 ? '+' : ''}${m.variacion} % frente al periodo anterior`

  return (
    <div className="mt-pagina">
      <HeaderEncargado />

      <div className="mt-cuerpo">
        <aside className="mt-lateral">
          <Operacion activo="tablero" onCambiar={(id) => navigate(RUTAS[id])} />
        </aside>

        <main className="mt-main">
          <div className="mt-cabecera">
            <div>
              <h1 className="mt-titulo">Tablero del almacén</h1>
              <p className="mt-subtitulo">
                {almacen ? `Almacén ${almacen}` : 'Sin almacén asignado'} · datos al{' '}
                {formatearFecha(hoyISO())}
              </p>
            </div>

            <div className="mt-controles">
              <Link to="/encargado/ranking">Ranking de equipos</Link>
              <div className="mt-rango" role="group" aria-label="Periodo">
                <input
                  type="date"
                  className="mt-fecha"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => cambiarDesde(e.target.value)}
                  aria-label="Desde"
                />
                <span className="mt-rango-guion">—</span>
                <input
                  type="date"
                  className="mt-fecha"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => cambiarHasta(e.target.value)}
                  aria-label="Hasta"
                />
              </div>

              <button type="button" className="mt-exportar" onClick={exportar} disabled={!m}>
                Exportar
              </button>
            </div>
          </div>

          {errorRango && (
            <p className="mt-error" role="alert">
              {errorRango}
            </p>
          )}
          {mensaje && (
            <p className="mt-ok" role="status">
              {mensaje}
            </p>
          )}

          {m && (
            <>
              <div className="mt-tarjetas">
                <div className="mt-tarjeta" style={{ '--acento': COLORES.periodo.acento }}>
                  <span className="mt-etiqueta">Préstamos del periodo</span>
                  <span className="mt-numero" style={{ color: COLORES.periodo.texto }}>
                    {m.periodo}
                  </span>
                  <span className="mt-nota mt-nota--verde">{variacionTexto}</span>
                </div>

                <div className="mt-tarjeta" style={{ '--acento': COLORES.disponibles.acento }}>
                  <span className="mt-etiqueta">Unidades disponibles</span>
                  <span className="mt-numero" style={{ color: COLORES.disponibles.texto }}>
                    {m.disponibles}
                  </span>
                  <span className="mt-nota">de {m.total} registradas</span>
                </div>

                <div className="mt-tarjeta" style={{ '--acento': COLORES.vencidos.acento }}>
                  <span className="mt-etiqueta">Préstamos vencidos</span>
                  <span className="mt-numero" style={{ color: COLORES.vencidos.texto }}>
                    {m.vencidos}
                  </span>
                  <span className="mt-nota" style={{ color: COLORES.vencidos.texto }}>
                    {soles(m.penalidad)} en penalidades
                  </span>
                </div>

                <div className="mt-tarjeta" style={{ '--acento': COLORES.mantenimiento.acento }}>
                  <span className="mt-etiqueta">En mantenimiento</span>
                  <span className="mt-numero" style={{ color: COLORES.mantenimiento.texto }}>
                    {m.mantenimiento}
                  </span>
                  <span className="mt-nota">unidades fuera de servicio</span>
                </div>
              </div>

              <div className="mt-paneles">
                <section className="mt-panel">
                  <h2 className="mt-panel-titulo">Préstamos por mes</h2>

                  {m.barras.length === 0 ? (
                    <p className="mt-vacio">No hay meses en el periodo elegido.</p>
                  ) : (
                    <>
                      <div className="mt-barras">
                        {m.barras.map((b) => (
                          <div className="mt-barra" key={b.clave}>
                            <span className="mt-barra-valor">{b.total}</span>
                            <div
                              className="mt-barra-relleno"
                              style={{
                                height: `${(b.total / maximoBarras) * 85}%`,
                                background: COLORES.barras
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-meses">
                        {m.barras.map((b) => (
                          <span key={b.clave}>{b.etiqueta}</span>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <section className="mt-panel">
                  <h2 className="mt-panel-titulo">Estado del inventario</h2>

                  {m.total === 0 && (
                    <p className="mt-vacio">No se encontraron unidades registradas en este almacén.</p>
                  )}

                  <ul className="mt-inventario">
                    {m.inventario.map((i) => (
                      <li key={i.id}>
                        <div className="mt-inv-fila">
                          <span>{i.etiqueta}</span>
                          <span>{i.valor}</span>
                        </div>
                        <div className="mt-pista">
                          <div
                            className="mt-relleno"
                            style={{
                              width: `${m.total ? (i.valor / m.total) * 100 : 0}%`,
                              background: i.color
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-resumen">
                    Tiempo promedio de préstamo:{' '}
                    <strong>{m.promedio === null ? '—' : `${m.promedio.toFixed(1)} días`}</strong> ·
                    devoluciones a tiempo: <strong>{m.aTiempo === null ? '—' : `${m.aTiempo} %`}</strong>{' '}
                    · unidad más solicitada:{' '}
                    <span className="mt-mono">{m.masSolicitada || '—'}</span>.
                  </p>
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      <FooterEncargado />
    </div>
  )
}

export default Metricas
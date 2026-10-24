import { obtenerTodasLasReservas, registrarReserva } from '../../data/Reservas'
import './Calendario.css'
import { useState, useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import Error403 from '../comun/403'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import { PRODUCTOS, obtenerProducto } from '../../data/Producto'
import { registrarSolicitud } from '../../data/Solicitudes'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const EQUIPO_INICIAL = 4 // Osciloscopio TBS1052B

/* ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ---------- */

const pad = (n) => String(n).padStart(2, '0')

function aISO(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`
}

function deISO(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function sumarDias(iso, n) {
  const fecha = deISO(iso)
  fecha.setDate(fecha.getDate() + n)
  return aISO(fecha)
}

function diasEntre(desde, hasta) {
  return Math.round((deISO(hasta) - deISO(desde)) / 86400000) + 1
}

function fechaCorta(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function fechaLarga(iso) {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

function plural(n, singular, pluralTexto) {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}

// Columna 0 = lunes ... 6 = domingo
function columnaSemana(iso) {
  return (deISO(iso).getDay() + 6) % 7
}

/* ---------- Almacenamiento de reservas y préstamos del calendario ---------- */

function leerReservas() {
  return obtenerTodasLasReservas().map((r) => ({ ...r, equipoId: r.productoId, inicio: r.desde, fin: r.hasta, tipo: 'Reservada' }))
}
/* ---------- Cálculos del calendario ---------- */

// Celdas del mes, empezando en lunes. Incluye días del mes anterior y siguiente.
function construirCeldas(anio, mes) {
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const filas = Math.ceil((desfase + diasMes) / 7)

  return Array.from({ length: filas * 7 }, (_, i) => {
    const fecha = new Date(anio, mes, 1 - desfase + i)
    return {
      iso: aISO(fecha),
      dia: fecha.getDate(),
      delMes: fecha.getMonth() === mes,
      columna: i % 7
    }
  })
}

// Ocupación de un día: cuántas unidades están prestadas, reservadas y libres
function calcularDia(iso, ctx) {
  const activas = ctx.reservas.filter((r) => iso >= r.inicio && iso <= r.fin)
  const base = iso >= ctx.hoy && iso <= ctx.finBase ? ctx.prestadasBase : 0

  const prestadas = activas.filter((r) => r.tipo === 'Prestada').length + base
  const reservadas = activas.filter((r) => r.tipo === 'Reservada').length
  const libres = Math.max(0, ctx.total - ctx.enMantenimiento - prestadas - reservadas)

  return { prestadas, reservadas, libres }
}

// Cantidad de días del rango y mínimo de unidades libres en algún día hábil
function analizarRango(desde, hasta, ctx) {
  const dias = diasEntre(desde, hasta)
  let minLibres = null

  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) {
    if (columnaSemana(d) === 6) continue // domingo: almacén cerrado
    const { libres } = calcularDia(d, ctx)
    minLibres = minLibres === null ? libres : Math.min(minLibres, libres)
  }

  return { dias, minLibres }
}

// Clase y textos que se muestran dentro de cada día
function describirDia(info, total) {
  if (info.libres === 0) {
    return {
      clase: 'reservado',
      linea1: plural(total, 'comprometida', 'comprometidas'),
      linea2: ''
    }
  }
  if (info.reservadas > 0) {
    return {
      clase: 'reservado',
      linea1: plural(info.reservadas, 'reservada', 'reservadas'),
      linea2: plural(info.libres, 'libre', 'libres')
    }
  }
  if (info.prestadas > 0) {
    return {
      clase: 'prestado',
      linea1: plural(info.prestadas, 'prestada', 'prestadas'),
      linea2: plural(info.libres, 'libre', 'libres')
    }
  }
  return { clase: 'libre', linea1: plural(info.libres, 'libre', 'libres'), linea2: '' }
}

/* ---------- Página ---------- */

function Calendario() {
  const [params] = useSearchParams()

  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  const hoy = aISO(new Date())
  const idParametro = Number(params.get('equipo'))
  const idInicial = PRODUCTOS.some((p) => p.id === idParametro) ? idParametro : EQUIPO_INICIAL

  const [equipoId, setEquipoId] = useState(idInicial)
  const [vista, setVista] = useState(() => {
    const ahora = new Date()
    return { anio: ahora.getFullYear(), mes: ahora.getMonth() }
  })
  const [inicio, setInicio] = useState(null)
  const [fin, setFin] = useState(null)
  const [reservas, setReservas] = useState(leerReservas)
  const [aviso, setAviso] = useState('')
  // Modal de reserva: null = cerrado, objeto = { desde, hasta, motivo }
  const [modal, setModal] = useState(null)

  // Cerrar el modal con Escape
  const modalAbierto = modal !== null
  useEffect(() => {
    if (!modalAbierto) return undefined
    const alPulsar = (e) => {
      if (e.key === 'Escape') setModal(null)
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [modalAbierto])

  // Acceso: solo estudiantes con sesión iniciada
  if (!cuenta) {
    return <Navigate to="/login" replace />
  }

  if (cuenta.rol !== 'estudiante') {
    return <Error403 />
  }

  const producto = obtenerProducto(equipoId)
  const total = producto.unidades.length
  const enMantenimiento = producto.unidades.filter((u) => u.estado === 'Mantenimiento').length
  const prestadasBase = producto.unidades.filter((u) => u.estado === 'Prestada').length
  // Las unidades prestadas hoy se consideran ocupadas hasta su próxima liberación
  const finBase = producto.proximaLiberacion || sumarDias(hoy, producto.duracionMax || 7)

  const reservasEquipo = reservas.filter((r) => r.equipoId === producto.id)
  const ctx = { reservas: reservasEquipo, total, enMantenimiento, prestadasBase, finBase, hoy }

  // Reservas propias de este equipo (para detectar solapamientos)
  const misReservas = reservasEquipo.filter(
    (r) => r.tipo === 'Reservada' && r.correo === cuenta.correo
  )

  const celdas = construirCeldas(vista.anio, vista.mes)

  /* Rango seleccionado */
  const rango = inicio ? { inicio, fin: fin || inicio } : null
  const enRango = (iso) => rango && iso >= rango.inicio && iso <= rango.fin

  let dias = 0
  let minLibres = null
  if (rango) {
    ;({ dias, minLibres } = analizarRango(rango.inicio, rango.fin, ctx))
  }

  const excedeDuracion = Boolean(rango && producto.duracionMax && dias > producto.duracionMax)
  const puedeConfirmar = Boolean(rango && minLibres > 0 && !excedeDuracion)

  /* Estado del modal: valida el rango que el estudiante tenga escrito en las fechas */
  let estadoModal = null
  if (modal) {
    const { desde, hasta } = modal

    if (!desde || !hasta) {
      estadoModal = { ok: false, mensaje: 'Elige la fecha de inicio y la fecha final.' }
    } else if (hasta < desde) {
      estadoModal = {
        ok: false,
        mensaje: 'La fecha final no puede ser anterior a la fecha de inicio.'
      }
    } else if (desde < hoy) {
      estadoModal = { ok: false, mensaje: 'No puedes reservar fechas pasadas.' }
    } else {
      const choque = misReservas.find((r) => desde <= r.fin && hasta >= r.inicio)
      const analisis = analizarRango(desde, hasta, ctx)

      if (choque) {
        estadoModal = {
          ok: false,
          mensaje: `Ya tienes una reserva de este equipo del ${fechaLarga(choque.inicio)} al ${fechaLarga(choque.fin)}. Ajusta el rango para continuar.`
        }
      } else if (producto.duracionMax && analisis.dias > producto.duracionMax) {
        estadoModal = {
          ok: false,
          mensaje: `Este equipo se presta máximo por ${producto.duracionMax} días. Ajusta el rango para continuar.`
        }
      } else if (!analisis.minLibres) {
        estadoModal = {
          ok: false,
          mensaje: 'Hay días del rango sin unidades libres. Ajusta el rango para continuar.'
        }
      } else {
        estadoModal = {
          ok: true,
          mensaje: `${plural(analisis.dias, 'día', 'días')} · sin solapamiento con tus otras reservas.`
        }
      }
    }
  }

  /* Unidades hoy: las reservas y préstamos activos hoy ocupan unidades disponibles */
  const unidadesHoy = producto.unidades.map((u) => ({ ...u }))
  reservasEquipo
    .filter((r) => hoy >= r.inicio && hoy <= r.fin)
    .forEach((r) => {
      const libre = unidadesHoy.find((u) => u.estado === 'Disponible')
      if (libre) libre.estado = r.tipo
    })
  const unidadesOrdenadas = [
    ...unidadesHoy.filter((u) => u.estado !== 'Disponible'),
    ...unidadesHoy.filter((u) => u.estado === 'Disponible')
  ]

  /* Acciones */
  const limpiarSeleccion = () => {
    setInicio(null)
    setFin(null)
  }

  // Date resuelve solo el cambio de año: diciembre → enero siguiente, enero → diciembre anterior
  const cambiarMes = (delta) => {
    setVista(({ anio, mes }) => {
      const fecha = new Date(anio, mes + delta, 1)
      return { anio: fecha.getFullYear(), mes: fecha.getMonth() }
    })
  }

  const cambiarEquipo = (id) => {
    setEquipoId(Number(id))
    limpiarSeleccion()
    setModal(null)
    setAviso('')
  }

  const seleccionarDia = (iso) => {
    setAviso('')

    if (!inicio || fin) {
      setInicio(iso)
      setFin(null)
      return
    }

    if (iso < inicio) {
      setFin(inicio)
      setInicio(iso)
      return
    }

    setFin(iso)
  }

  /* Modal de reserva */
  const abrirModal = () => {
    if (!rango || !puedeConfirmar) return
    setAviso('')
    setModal({ desde: rango.inicio, hasta: rango.fin, motivo: '' })
  }

  const cerrarModal = () => setModal(null)

  const cambiarCampoModal = (campo, valor) => {
    setModal((actual) => ({ ...actual, [campo]: valor }))
  }

  const confirmarReserva = () => {
    if (!modal || !estadoModal || !estadoModal.ok) return

    registrarReserva({ correo: cuenta.correo, productoId: producto.id, desde: modal.desde, hasta: modal.hasta })
    setReservas(leerReservas())

    setAviso(
      `Reserva confirmada del ${fechaCorta(modal.desde)} al ${fechaLarga(modal.hasta)}. La verás en «Mis reservas».`
    )
    setModal(null)
    limpiarSeleccion()
  }

  /* Préstamo directo (no pasa por el modal) */
  const confirmarPrestamo = () => {
    if (!rango || !puedeConfirmar) return

    try {
      const unidadLibre = producto.unidades.find((u) => u.estado === 'Disponible')
      registrarSolicitud(cuenta.correo, {
        productoId: producto.id,
        desde: rango.inicio, hasta: rango.fin,
        equipo: producto.nombre,
        curso: '',
        inicio: rango.inicio,
        devolucion: rango.fin,
        motivo: 'Préstamo directo desde el calendario',
        estado: 'Enviada',
        unidad: unidadLibre ? unidadLibre.codigo : ''
      })
    } catch (error) {
      console.error('Error al registrar la solicitud:', error)
    }

    setAviso(`Solicitud enviada para ${fechaCorta(rango.inicio)} → ${fechaCorta(rango.fin)}. La verás en Mis solicitudes.`)
    limpiarSeleccion()
  }

  return (
    <>
      <HeaderEstudiante />

      <main className="calendario-main">
        <div className="calendario-cabecera">
          <div>
            <h1>Calendario de ocupación</h1>
            <p className="calendario-subtitulo">
              {producto.titulo} · {plural(total, 'unidad', 'unidades')}
            </p>
          </div>

          <div className="calendario-controles">
            <select
              value={equipoId}
              onChange={(e) => cambiarEquipo(e.target.value)}
              aria-label="Elegir equipo"
            >
              {PRODUCTOS.map((p) => (
                <option key={p.id} value={p.id}>
                  Equipo: {p.nombre}
                </option>
              ))}
            </select>

            <div className="calendario-mes">
              <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
                ‹
              </button>
              <strong>
                {MESES[vista.mes]} {vista.anio}
              </strong>
              <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
                ›
              </button>
            </div>
          </div>
        </div>

        {aviso && (
          <div className="calendario-aviso" role="status">
            <span>{aviso}</span>
            <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}

        <div className="calendario-layout">
          <section className="calendario-tarjeta">
            <div className="calendario-scroll">
              <div className="calendario-grid">
                {DIAS.map((nombre) => (
                  <div key={nombre} className="calendario-dia-nombre">
                    {nombre}
                  </div>
                ))}

                {celdas.map((celda) => {
                  const esHoy = celda.iso === hoy
                  const inactivo = !celda.delMes || celda.iso < hoy || celda.columna === 6
                  const seleccionado = !inactivo && enRango(celda.iso)

                  if (inactivo) {
                    return (
                      <div
                        key={celda.iso}
                        className={`calendario-dia calendario-dia-inactivo${
                          celda.delMes ? '' : ' calendario-dia-fuera'
                        }`}
                      >
                        <span className="calendario-dia-num">{celda.dia}</span>
                      </div>
                    )
                  }

                  const info = calcularDia(celda.iso, ctx)
                  const texto = describirDia(info, total)
                  const clases = [
                    'calendario-dia',
                    `calendario-dia-${seleccionado ? 'seleccion' : texto.clase}`,
                    esHoy ? 'calendario-dia-hoy' : ''
                  ].join(' ')

                  return (
                    <button
                      key={celda.iso}
                      type="button"
                      className={clases}
                      aria-pressed={seleccionado}
                      onClick={() => seleccionarDia(celda.iso)}
                    >
                      <span className="calendario-dia-num">{celda.dia}</span>

                      {seleccionado ? (
                        <span className="calendario-dia-info">selección</span>
                      ) : (
                        <>
                          <span className="calendario-dia-info">
                            {esHoy ? `hoy · ${plural(info.libres, 'libre', 'libres')}` : texto.linea1}
                          </span>
                          {!esHoy && texto.linea2 && (
                            <span className="calendario-dia-sub">{texto.linea2}</span>
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <ul className="calendario-leyenda">
              <li>
                <i className="calendario-muestra calendario-muestra-libre" />
                Con unidades libres
              </li>
              <li>
                <i className="calendario-muestra calendario-muestra-prestado" />
                Con unidades prestadas
              </li>
              <li>
                <i className="calendario-muestra calendario-muestra-reservado" />
                Reservadas o sin disponibilidad
              </li>
              <li>
                <i className="calendario-muestra calendario-muestra-seleccion" />
                Rango seleccionado
              </li>
            </ul>
          </section>

          <aside className="calendario-lateral">
            <section className="calendario-tarjeta">
              <p className="calendario-etiqueta">Rango seleccionado</p>

              {!rango ? (
                <p className="calendario-tenue">
                  Haz clic en un día para empezar y en otro para cerrar el rango.
                </p>
              ) : (
                <>
                  <p className="calendario-rango-fechas">
                    {fechaCorta(rango.inicio)} → {fechaLarga(rango.fin)}
                  </p>
                  <p className="calendario-tenue">
                    {plural(dias, 'día', 'días')} ·{' '}
                    {plural(minLibres ?? 0, 'unidad libre', 'unidades libres')} en todo el rango
                  </p>
                  {!fin && (
                    <p className="calendario-tenue">
                      Haz clic en otro día para ampliar el rango.
                    </p>
                  )}
                  {excedeDuracion && (
                    <p className="calendario-error">
                      Este equipo se presta máximo por {producto.duracionMax} días.
                    </p>
                  )}
                  {!excedeDuracion && minLibres === 0 && (
                    <p className="calendario-error">
                      Hay días del rango sin unidades libres.
                    </p>
                  )}
                </>
              )}

              <button
                type="button"
                className="calendario-btn calendario-btn-primario"
                disabled={!puedeConfirmar}
                onClick={abrirModal}
              >
                Reservar este rango
              </button>
              <button
                type="button"
                className="calendario-btn calendario-btn-secundario"
                disabled={!puedeConfirmar}
                onClick={confirmarPrestamo}
              >
                Solicitar préstamo directo
              </button>
            </section>

            <section className="calendario-tarjeta">
              <p className="calendario-etiqueta">Unidades comprometidas hoy</p>

              <ul className="calendario-unidades">
                {unidadesOrdenadas.map((unidad) => (
                  <li
                    key={unidad.codigo}
                    className={unidad.estado === 'Disponible' ? 'calendario-unidad-libre' : ''}
                  >
                    <span className="calendario-mono">{unidad.codigo}</span>
                    <strong className={`calendario-estado calendario-estado-${unidad.estado.toLowerCase()}`}>
                      {unidad.estado}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>

      {modal && estadoModal && (
        <div className="calendario-modal-fondo" onMouseDown={cerrarModal}>
          <div
            className="calendario-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendario-modal-titulo"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="calendario-modal-titulo">Reservar equipo</h2>
            <p className="calendario-modal-sub">
              {producto.titulo} · rango marcado en el calendario
            </p>

            <div className="calendario-modal-fechas">
              <label className="calendario-campo">
                <span className="calendario-etiqueta">Desde</span>
                <input
                  type="date"
                  className="calendario-mono"
                  value={modal.desde}
                  min={hoy}
                  onChange={(e) => cambiarCampoModal('desde', e.target.value)}
                />
              </label>

              <label className="calendario-campo">
                <span className="calendario-etiqueta">Hasta</span>
                <input
                  type="date"
                  className="calendario-mono"
                  value={modal.hasta}
                  min={modal.desde || hoy}
                  onChange={(e) => cambiarCampoModal('hasta', e.target.value)}
                />
              </label>
            </div>

            {estadoModal.ok ? (
              <p className="calendario-modal-ok" role="status">
                {estadoModal.mensaje}
              </p>
            ) : (
              <div className="calendario-modal-error" role="alert">
                {estadoModal.mensaje}
              </div>
            )}

            <label className="calendario-campo">
              <span className="calendario-etiqueta">Motivo</span>
              <textarea
                rows={3}
                value={modal.motivo}
                placeholder="Ej. Mediciones del proyecto final del laboratorio"
                onChange={(e) => cambiarCampoModal('motivo', e.target.value)}
              />
            </label>

            <div className="calendario-modal-espera">
              Si al llegar la fecha no hay unidades libres, tu reserva pasará a lista de espera
              con el orden de tu registro.
            </div>

            <div className="calendario-modal-acciones">
              <button
                type="button"
                className="calendario-btn calendario-btn-secundario"
                onClick={cerrarModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="calendario-btn calendario-btn-primario"
                disabled={!estadoModal.ok}
                onClick={confirmarReserva}
              >
                Reservar
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterEstudiante />
    </>
  )
}

export default Calendario
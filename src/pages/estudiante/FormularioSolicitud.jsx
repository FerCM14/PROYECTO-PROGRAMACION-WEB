import './FormularioSolicitud.css'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import Error403 from '../comun/403'
import { obtenerSesion, obtenerCuenta } from '../../data/cuentas'
import { obtenerProducto, RECOJO } from '../../data/Producto'
import { totalDeuda, PENALIDAD_POR_DIA } from '../../data/deudas'
import { registrarSolicitud } from '../../data/Solicitudes'
import {
  hoyISO,
  sumarDias,
  diferenciaDias,
  formatearFecha,
  formatearCorto,
  obtenerRangosOcupados,
  hayConflicto,
  proximoRangoLibre
} from '../../data/Disponibilidad'

const MIN_MOTIVO = 20
const DIAS_SUGERIDOS = 5
const HORA_DEVOLUCION = '19:00'

const CURSOS = [
  'IN324 Laboratorio de Circuitos Electrónicos · Ing. Elena Rivas',
  'IN251 Sistemas Digitales · Ing. Marco Paredes',
  'IN418 Instrumentación y Control · Ing. Lucía Salazar',
  'IN305 Redes de Computadoras · Ing. Jorge Valdivia',
  'IN132 Física Experimental · Ing. Patricia Núñez'
]

function formatearSoles(monto) {
  return `S/ ${monto.toFixed(2)}`
}

/* ---------- Estados implementados como funciones ---------- */

// Estado: duración excedida (mensaje rojo)
function AvisoDuracion({ dias, max, fechaMaxima }) {
  return (
    <div className="solicitud-aviso solicitud-aviso-rojo" role="alert">
      Duración excedida: {dias} días solicitados y el máximo es {max}. Ajusta la
      devolución al <strong>{formatearFecha(fechaMaxima)}</strong> o antes.
    </div>
  )
}

// Estado: sin unidades libres en las fechas pedidas (mensaje amarillo)
function AvisoSinDisponibilidad({ inicio, fin, sugerido, onUsar }) {
  return (
    <div className="solicitud-aviso solicitud-aviso-amarillo" role="alert">
      Fechas no disponibles: no hay unidades libres entre el{' '}
      <strong>{formatearCorto(inicio)}</strong> y el{' '}
      <strong>{formatearCorto(fin)}</strong>. Próximo rango libre del{' '}
      <strong>{formatearCorto(sugerido.inicio)}</strong> al{' '}
      <strong>{formatearFecha(sugerido.fin)}</strong>.{' '}
      <button type="button" className="solicitud-enlace" onClick={onUsar}>
        Usar este rango
      </button>
    </div>
  )
}

// Estado: error al guardar la solicitud
function EstadoErrorEnvio() {
  return (
    <div className="solicitud-aviso solicitud-aviso-rojo" role="alert">
      No se pudo enviar la solicitud en este navegador. Revisa que el
      almacenamiento local esté habilitado e inténtalo de nuevo.
    </div>
  )
}

/* ---------- Página ---------- */

function FormularioSolicitud() {
  const { id } = useParams()
  const navigate = useNavigate()
  const hoy = hoyISO()

  const [inicio, setInicio] = useState(sumarDias(hoy, 1))
  const [devolucion, setDevolucion] = useState(sumarDias(hoy, 3))
  const [curso, setCurso] = useState('')
  const [motivo, setMotivo] = useState('')
  const [acepto, setAcepto] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorEnvio, setErrorEnvio] = useState(false)

  // Acceso: solo estudiantes con sesión iniciada
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  if (!cuenta) {
    return <Navigate to="/login" replace />
  }

  if (cuenta.rol !== 'estudiante') {
    return <Error403 />
  }

  const producto = obtenerProducto(id)

  if (!producto) {
    return <Navigate to="/catalogo" replace />
  }

  // Con deuda pendiente no se puede solicitar
  if (totalDeuda(cuenta.correo) > 0) {
    return <Navigate to={`/catalogo/${producto.id}`} replace />
  }

  /* ----- Cálculos de fechas ----- */

  const max = producto.duracionMax // null = sin límite
  const fechasCompletas = Boolean(inicio && devolucion)

  // Duración = fecha de devolución - fecha de inicio (no editable)
  const dias = fechasCompletas ? diferenciaDias(inicio, devolucion) : null
  const ordenInvalido = dias !== null && dias < 1
  const duracionValida = dias !== null && !ordenInvalido
  const excedida = duracionValida && max !== null && dias > max

  const rangosOcupados = obtenerRangosOcupados(producto.id)
  const sinDisponibilidad =
    duracionValida && hayConflicto(rangosOcupados, inicio, devolucion)

  const sugerido = sinDisponibilidad
    ? proximoRangoLibre(
        rangosOcupados,
        inicio,
        Math.min(DIAS_SUGERIDOS, max ?? DIAS_SUGERIDOS)
      )
    : null

  let textoDuracion = '—'
  if (duracionValida) {
    textoDuracion =
      max !== null
        ? `${dias} de ${max} días`
        : `${dias} ${dias === 1 ? 'día' : 'días'}`
  }

  /* ----- Manejadores ----- */

  const cambiarInicio = (e) => {
    const valor = e.target.value
    setInicio(valor)

    // Si la devolución queda antes del inicio, se mueve al día siguiente
    if (valor && devolucion && devolucion <= valor) {
      setDevolucion(sumarDias(valor, 1))
    }

    setErrores({ ...errores, fechas: undefined })
  }

  const cambiarDevolucion = (e) => {
    setDevolucion(e.target.value)
    setErrores({ ...errores, fechas: undefined })
  }

  const usarRangoSugerido = () => {
    setInicio(sugerido.inicio)
    setDevolucion(sugerido.fin)
    setErrores({ ...errores, fechas: undefined })
  }

  const enviar = (e) => {
    e.preventDefault()
    setErrorEnvio(false)

    const nuevos = {}

    if (!fechasCompletas) {
      nuevos.fechas = 'Selecciona la fecha de inicio y la de devolución.'
    } else if (ordenInvalido) {
      nuevos.fechas = 'La devolución debe ser posterior a la fecha de inicio.'
    }

    if (!curso) nuevos.curso = 'Selecciona el curso asociado.'

    if (motivo.trim().length < MIN_MOTIVO) {
      nuevos.motivo = `Escribe al menos ${MIN_MOTIVO} caracteres.`
    }

    if (!acepto) nuevos.acepto = 'Debes aceptar las condiciones del préstamo.'

    setErrores(nuevos)

    // Los avisos rojo y amarillo ya explican por qué no se puede enviar
    if (Object.keys(nuevos).length > 0 || excedida || sinDisponibilidad) return

    try {
      registrarSolicitud(cuenta.correo, {
        equipoId: producto.id,
        equipo: producto.nombre,
        inicio,
        devolucion,
        dias,
        curso,
        motivo: motivo.trim()
      })

      navigate('/estudiante/mis-solicitudes')
    } catch (error) {
      console.error('Error al enviar la solicitud:', error)
      setErrorEnvio(true)
    }
  }

  return (
    <>
      <HeaderEstudiante />

      <main className="solicitud-main">
        <nav className="solicitud-ruta" aria-label="Ruta">
          <Link to="/catalogo">Catálogo</Link> /{' '}
          <Link to={`/catalogo/${producto.id}`}>{producto.nombre}</Link> /
          Solicitar préstamo
        </nav>

        <h1>Solicitar préstamo</h1>

        <div className="solicitud-layout">
          {/* ----- Formulario ----- */}
          <form className="solicitud-card" onSubmit={enviar} noValidate>
            <h2 className="solicitud-seccion">Fechas del préstamo</h2>

            <div className="solicitud-fila">
              <div className="solicitud-campo">
                <label htmlFor="inicio">Fecha de inicio</label>
                <input
                  id="inicio"
                  type="date"
                  value={inicio}
                  min={hoy}
                  onChange={cambiarInicio}
                />
              </div>

              <div className="solicitud-campo">
                <label htmlFor="devolucion">Fecha de devolución</label>
                <input
                  id="devolucion"
                  type="date"
                  value={devolucion}
                  min={inicio ? sumarDias(inicio, 1) : hoy}
                  onChange={cambiarDevolucion}
                />
              </div>

              <div className="solicitud-campo">
                <label htmlFor="duracion">Duración</label>
                <input
                  id="duracion"
                  type="text"
                  value={textoDuracion}
                  readOnly
                  tabIndex={-1}
                  className={
                    excedida
                      ? 'solicitud-duracion solicitud-duracion-excedida'
                      : 'solicitud-duracion'
                  }
                />
              </div>
            </div>

            <p className="solicitud-ayuda">
              {max !== null
                ? `La duración máxima de este equipo es de ${max} días calendario.`
                : 'Este equipo no tiene límite de duración.'}
            </p>

            {errores.fechas && <p className="solicitud-error">{errores.fechas}</p>}
            {ordenInvalido && !errores.fechas && (
              <p className="solicitud-error">
                La devolución debe ser posterior a la fecha de inicio.
              </p>
            )}

            {excedida && (
              <AvisoDuracion
                dias={dias}
                max={max}
                fechaMaxima={sumarDias(inicio, max)}
              />
            )}

            {sinDisponibilidad && (
              <AvisoSinDisponibilidad
                inicio={inicio}
                fin={devolucion}
                sugerido={sugerido}
                onUsar={usarRangoSugerido}
              />
            )}

            <h2 className="solicitud-seccion">Justificación</h2>

            <div className="solicitud-campo solicitud-campo-bloque">
              <label htmlFor="curso">Curso asociado</label>
              <select
                id="curso"
                value={curso}
                onChange={(e) => {
                  setCurso(e.target.value)
                  setErrores({ ...errores, curso: undefined })
                }}
                className={errores.curso ? 'solicitud-input-error' : ''}
              >
                <option value="">Selecciona un curso</option>
                {CURSOS.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
              {errores.curso && <p className="solicitud-error">{errores.curso}</p>}
            </div>

            <div className="solicitud-campo solicitud-campo-bloque">
              <label htmlFor="motivo">Motivo de la solicitud</label>
              <textarea
                id="motivo"
                rows={5}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value)
                  setErrores({ ...errores, motivo: undefined })
                }}
                className={errores.motivo ? 'solicitud-input-error' : ''}
              />
              {errores.motivo ? (
                <p className="solicitud-error">{errores.motivo}</p>
              ) : (
                <p className="solicitud-ayuda">
                  Mínimo {MIN_MOTIVO} caracteres. El encargado lo verá al
                  evaluar tu solicitud.
                </p>
              )}
            </div>

            {errorEnvio && <EstadoErrorEnvio />}

            <div className="solicitud-acciones">
              <Link to={`/catalogo/${producto.id}`} className="solicitud-cancelar">
                Cancelar
              </Link>

              <button type="submit" className="solicitud-btn">
                Enviar solicitud
              </button>
            </div>
          </form>

          {/* ----- Resumen del equipo ----- */}
          <aside className="solicitud-lateral">
            <section className="solicitud-card solicitud-equipo">
              <div className="solicitud-equipo-cabecera">
                <div className="solicitud-miniatura" aria-hidden="true" />
                <div>
                  <strong>{producto.nombre}</strong>
                  <p>
                    {producto.marca} · {producto.libres} de {producto.total}{' '}
                    unidades libres
                  </p>
                </div>
              </div>

              <h3 className="solicitud-subtitulo">Condiciones que aceptas</h3>

              <p className="solicitud-condiciones">
                Devolución el{' '}
                <strong>
                  {devolucion ? formatearFecha(devolucion) : 'la fecha elegida'}
                </strong>{' '}
                antes de las {HORA_DEVOLUCION} en el {RECOJO.lugar} ·
                verificación de accesorios en la entrega y el retorno ·
                penalidad de {formatearSoles(PENALIDAD_POR_DIA)} por día de
                retraso · {producto.renovable ? 'admite renovación' : 'sin renovación'}.
              </p>

              <label className="solicitud-check">
                <input
                  type="checkbox"
                  checked={acepto}
                  onChange={(e) => {
                    setAcepto(e.target.checked)
                    setErrores({ ...errores, acepto: undefined })
                  }}
                />
                <span>Acepto las condiciones del préstamo.</span>
              </label>

              {errores.acepto && <p className="solicitud-error">{errores.acepto}</p>}
            </section>
          </aside>
        </div>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default FormularioSolicitud
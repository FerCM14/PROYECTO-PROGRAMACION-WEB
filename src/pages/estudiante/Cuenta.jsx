import './Cuenta.css'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import {
  obtenerSesion,
  obtenerCuenta,
  actualizarPerfil,
  cambiarContrasena
} from '../../data/cuentas'
import { contarPrestamos } from '../../data/prestamos'
import { contarRetrasos } from '../../data/retrasos'
import { obtenerDeudasPendientes, totalDeuda } from '../../data/deudas'

const CARRERAS = [
  'Ingeniería Civil',
  'Ingeniería Electrónica',
  'Ingeniería Industrial',
  'Ingeniería de Sistemas'
]

const CICLOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const CLAVE_INICIAL = { actual: '', nueva: '', confirmar: '' }

function formatearSoles(monto) {
  return `S/ ${monto.toFixed(2)}`
}

function formatearCelular(digitos) {
  return (digitos || '').replace(/(\d{3})(?=\d)/g, '$1 ')
}

function cumpleRequisitos(clave) {
  return clave.length >= 8 && /[A-Z]/.test(clave) && /[0-9]/.test(clave)
}

function datosDesdeCuenta(cuenta) {
  return {
    nombres: cuenta?.nombres || '',
    apellidos: cuenta?.apellidos || '',
    carrera: cuenta?.carrera || '',
    ciclo: String(cuenta?.ciclo || ''),
    celular: cuenta?.celular || ''
  }
}

function validarPerfil(datos) {
  const errores = {}

  if (!datos.nombres.trim()) errores.nombres = 'Ingresa tus nombres.'
  if (!datos.apellidos.trim()) errores.apellidos = 'Ingresa tus apellidos.'
  if (!datos.carrera) errores.carrera = 'Selecciona tu carrera.'
  if (!datos.ciclo) errores.ciclo = 'Selecciona tu ciclo.'

  if (datos.celular && !/^9\d{8}$/.test(datos.celular)) {
    errores.celular = 'Ingresa un celular de 9 dígitos que empiece con 9.'
  }

  return errores
}

/* ---------- Campo reutilizable ---------- */

function Campo({ id, etiqueta, ayuda, error, children }) {
  return (
    <div className="micuenta-campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? (
        <p className="micuenta-error">{error}</p>
      ) : (
        ayuda && <p className="micuenta-ayuda">{ayuda}</p>
      )}
    </div>
  )
}

/* ---------- Estados implementados como funciones ---------- */

// Aviso de penalidad: solo aparece si la cuenta tiene deuda pendiente
function AvisoPenalidad({ pendientes }) {
  if (pendientes.length === 0) return null

  if (pendientes.length === 1) {
    const deuda = pendientes[0]

    return (
      <div className="micuenta-aviso" role="alert">
        Tienes una penalidad pendiente de{' '}
        <span className="micuenta-mono">{formatearSoles(deuda.monto)}</span> por{' '}
        {deuda.dias} {deuda.dias === 1 ? 'día' : 'días'} de retraso en{' '}
        <span className="micuenta-mono">{deuda.codigo}</span>. Regularízala en
        Tesorería para volver a solicitar equipos.
      </div>
    )
  }

  const total = pendientes.reduce((suma, deuda) => suma + deuda.monto, 0)

  return (
    <div className="micuenta-aviso" role="alert">
      Tienes {pendientes.length} penalidades pendientes por un total de{' '}
      <span className="micuenta-mono">{formatearSoles(total)}</span>.
      Regularízalas en Tesorería para volver a solicitar equipos.
    </div>
  )
}

// Mensaje de resultado (éxito o error) de cada formulario
function EstadoMensaje({ mensaje }) {
  if (!mensaje) return null

  return (
    <p
      className={`micuenta-mensaje micuenta-mensaje-${mensaje.tipo}`}
      role="status"
    >
      {mensaje.texto}
    </p>
  )
}

/* ---------- Página ---------- */

function MiCuenta() {
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null

  const [datos, setDatos] = useState(() => datosDesdeCuenta(cuenta))
  const [erroresPerfil, setErroresPerfil] = useState({})
  const [mensajePerfil, setMensajePerfil] = useState(null)

  const [clave, setClave] = useState(CLAVE_INICIAL)
  const [erroresClave, setErroresClave] = useState({})
  const [mensajeClave, setMensajeClave] = useState(null)

  // Sin sesión válida, vuelve al login
  if (!cuenta) {
    return <Navigate to="/login" replace />
  }

  // Resumen: se lee de las tres bases de datos de esta cuenta
  const prestamos = contarPrestamos(cuenta.correo)
  const retrasos = contarRetrasos(cuenta.correo)
  const pendientes = obtenerDeudasPendientes(cuenta.correo)
  const deuda = totalDeuda(cuenta.correo)

  /* ----- Datos personales ----- */

  const cambiarDato = (e) => {
    const { name, value } = e.target
    const nuevoValor =
      name === 'celular' ? value.replace(/\D/g, '').slice(0, 9) : value

    setDatos({ ...datos, [name]: nuevoValor })
    setErroresPerfil({ ...erroresPerfil, [name]: undefined })
    setMensajePerfil(null)
  }

  const descartarCambios = () => {
    setDatos(datosDesdeCuenta(cuenta))
    setErroresPerfil({})
    setMensajePerfil(null)
  }

  const guardarPerfil = (e) => {
    e.preventDefault()

    const nuevos = validarPerfil(datos)
    setErroresPerfil(nuevos)

    if (Object.keys(nuevos).length > 0) {
      setMensajePerfil(null)
      return
    }

    try {
      const respuesta = actualizarPerfil(cuenta.correo, datos)

      setMensajePerfil(
        respuesta.ok
          ? { tipo: 'exito', texto: 'Cambios guardados.' }
          : { tipo: 'error', texto: 'No se pudieron guardar los cambios.' }
      )
    } catch (error) {
      console.error('Error al guardar el perfil:', error)
      setMensajePerfil({
        tipo: 'error',
        texto: 'No se pudieron guardar los cambios.'
      })
    }
  }

  /* ----- Cambiar contraseña ----- */

  const cambiarCampoClave = (e) => {
    const { name, value } = e.target

    setClave({ ...clave, [name]: value })
    setErroresClave({ ...erroresClave, [name]: undefined })
    setMensajeClave(null)
  }

  const actualizarClave = (e) => {
    e.preventDefault()

    const errores = {}

    if (!clave.actual) errores.actual = 'Ingresa tu contraseña actual.'

    if (!clave.nueva) {
      errores.nueva = 'Ingresa la nueva contraseña.'
    } else if (!cumpleRequisitos(clave.nueva)) {
      errores.nueva = 'Mínimo 8 caracteres, una mayúscula y un número.'
    } else if (clave.nueva === clave.actual) {
      errores.nueva = 'Debe ser distinta de la actual.'
    }

    if (!clave.confirmar) {
      errores.confirmar = 'Confirma la contraseña.'
    } else if (clave.confirmar !== clave.nueva) {
      errores.confirmar = 'No coinciden.'
    }

    setErroresClave(errores)

    if (Object.keys(errores).length > 0) {
      setMensajeClave(null)
      return
    }

    try {
      const respuesta = cambiarContrasena(cuenta.correo, clave.actual, clave.nueva)

      if (!respuesta.ok) {
        setErroresClave({ actual: 'La contraseña actual no es correcta.' })
        setMensajeClave(null)
        return
      }

      setClave(CLAVE_INICIAL)
      setMensajeClave({ tipo: 'exito', texto: 'Contraseña actualizada.' })
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error)
      setMensajeClave({
        tipo: 'error',
        texto: 'No se pudo actualizar la contraseña.'
      })
    }
  }

  const claseInput = (errores, campo) =>
    errores[campo] ? 'micuenta-input-error' : ''

  return (
    <>
      <HeaderEstudiante />

      <main className="micuenta-main">
        <p className="micuenta-ruta">Inicio / Mi cuenta</p>
        <h1>Mi cuenta</h1>

        <AvisoPenalidad pendientes={pendientes} />

        <div className="micuenta-grid">
          {/* ----- Datos personales ----- */}
          <form className="micuenta-card" onSubmit={guardarPerfil} noValidate>
            <h2>Datos personales</h2>

            <div className="micuenta-fila">
              <Campo id="nombres" etiqueta="Nombres" error={erroresPerfil.nombres}>
                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  value={datos.nombres}
                  onChange={cambiarDato}
                  className={claseInput(erroresPerfil, 'nombres')}
                />
              </Campo>

              <Campo
                id="apellidos"
                etiqueta="Apellidos"
                error={erroresPerfil.apellidos}
              >
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  value={datos.apellidos}
                  onChange={cambiarDato}
                  className={claseInput(erroresPerfil, 'apellidos')}
                />
              </Campo>
            </div>

            <div className="micuenta-fila">
              <Campo id="carrera" etiqueta="Carrera" error={erroresPerfil.carrera}>
                <select
                  id="carrera"
                  name="carrera"
                  value={datos.carrera}
                  onChange={cambiarDato}
                  className={claseInput(erroresPerfil, 'carrera')}
                >
                  <option value="">Selecciona tu carrera</option>
                  {CARRERAS.map((carrera) => (
                    <option key={carrera} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id="ciclo" etiqueta="Ciclo" error={erroresPerfil.ciclo}>
                <select
                  id="ciclo"
                  name="ciclo"
                  value={datos.ciclo}
                  onChange={cambiarDato}
                  className={claseInput(erroresPerfil, 'ciclo')}
                >
                  <option value="">Selecciona tu ciclo</option>
                  {CICLOS.map((ciclo) => (
                    <option key={ciclo} value={ciclo}>
                      {ciclo}.º
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="micuenta-fila">
              <Campo id="correo" etiqueta="Correo institucional" ayuda="No editable.">
                <input
                  id="correo"
                  type="email"
                  value={cuenta.correo}
                  readOnly
                  className="micuenta-input-lectura"
                />
              </Campo>

              <Campo id="celular" etiqueta="Celular" error={erroresPerfil.celular}>
                <input
                  id="celular"
                  name="celular"
                  type="tel"
                  inputMode="numeric"
                  placeholder="987 654 321"
                  value={formatearCelular(datos.celular)}
                  onChange={cambiarDato}
                  className={`micuenta-mono-input ${claseInput(erroresPerfil, 'celular')}`}
                />
              </Campo>
            </div>

            <div className="micuenta-acciones">
              <EstadoMensaje mensaje={mensajePerfil} />

              <button
                type="button"
                className="micuenta-btn-secundario"
                onClick={descartarCambios}
              >
                Descartar
              </button>

              <button type="submit" className="micuenta-btn-primario">
                Guardar cambios
              </button>
            </div>
          </form>

          <div className="micuenta-columna">
            {/* ----- Cambiar contraseña ----- */}
            <form className="micuenta-card" onSubmit={actualizarClave} noValidate>
              <h2>Cambiar contraseña</h2>

              <div className="micuenta-fila micuenta-fila-una">
                <Campo
                  id="actual"
                  etiqueta="Contraseña actual"
                  error={erroresClave.actual}
                >
                  <input
                    id="actual"
                    name="actual"
                    type="password"
                    autoComplete="current-password"
                    value={clave.actual}
                    onChange={cambiarCampoClave}
                    className={claseInput(erroresClave, 'actual')}
                  />
                </Campo>
              </div>

              <div className="micuenta-fila">
                <Campo id="nueva" etiqueta="Nueva" error={erroresClave.nueva}>
                  <input
                    id="nueva"
                    name="nueva"
                    type="password"
                    autoComplete="new-password"
                    value={clave.nueva}
                    onChange={cambiarCampoClave}
                    className={claseInput(erroresClave, 'nueva')}
                  />
                </Campo>

                <Campo id="confirmar" etiqueta="Confirmar" error={erroresClave.confirmar}>
                  <input
                    id="confirmar"
                    name="confirmar"
                    type="password"
                    autoComplete="new-password"
                    value={clave.confirmar}
                    onChange={cambiarCampoClave}
                    className={claseInput(erroresClave, 'confirmar')}
                  />
                </Campo>
              </div>

              <button type="submit" className="micuenta-btn-bloque">
                Actualizar contraseña
              </button>

              <EstadoMensaje mensaje={mensajeClave} />
            </form>

            {/* ----- Resumen de préstamos ----- */}
            <section className="micuenta-card">
              <h2>Resumen de préstamos</h2>

              <div className="micuenta-resumen">
                <div className="micuenta-dato">
                  <strong className="micuenta-num">{prestamos}</strong>
                  <span>préstamos</span>
                </div>

                <div className="micuenta-dato">
                  <strong
                    className={
                      retrasos > 0
                        ? 'micuenta-num micuenta-num-retraso'
                        : 'micuenta-num'
                    }
                  >
                    {retrasos}
                  </strong>
                  <span>retrasos</span>
                </div>

                <div className="micuenta-dato">
                  <strong
                    className={
                      deuda > 0
                        ? 'micuenta-num micuenta-num-deuda'
                        : 'micuenta-num'
                    }
                  >
                    {formatearSoles(deuda)}
                  </strong>
                  <span>deuda</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default MiCuenta
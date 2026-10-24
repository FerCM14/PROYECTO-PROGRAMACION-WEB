import './Recuperar.css'
import { Fragment, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderVisitante from '../../components/Header/Header-Visitante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import { existeCuenta, actualizarContrasena } from '../../data/cuentas'

const DOMINIO = '@aloe.ulima.edu.pe'
const REGEX_CORREO = /^[^\s@]+@aloe\.ulima\.edu\.pe$/i

// Segundos que el usuario debe esperar para poder reenviar el enlace
const ESPERA_REENVIO = 45

// Simulación: segundos hasta que "llega la señal" (el usuario abre el enlace
// del correo) y se pasa al paso 3
const SEGUNDOS_HASTA_ENLACE = 6

const PASOS = [1, 2, 3]

function formatearTiempo(total) {
  const minutos = String(Math.floor(total / 60)).padStart(2, '0')
  const segundos = String(total % 60).padStart(2, '0')
  return `${minutos}:${segundos}`
}

function cumpleRequisitos(clave) {
  return clave.length >= 8 && /[A-Z]/.test(clave) && /[0-9]/.test(clave)
}

function evaluarSeguridad(clave) {
  if (!clave) return { nivel: 'vacio', etiqueta: '', porcentaje: 0 }

  const puntos = [
    clave.length >= 8,
    clave.length >= 12,
    /[A-Z]/.test(clave),
    /[a-z]/.test(clave),
    /[0-9]/.test(clave),
    /[^A-Za-z0-9]/.test(clave)
  ].filter(Boolean).length

  if (puntos <= 2) return { nivel: 'debil', etiqueta: 'Débil', porcentaje: 33 }
  if (puntos <= 4) return { nivel: 'media', etiqueta: 'Media', porcentaje: 66 }
  return { nivel: 'segura', etiqueta: 'Segura', porcentaje: 100 }
}

/* ---------- Indicador de pasos (solo decoración, no son botones) ---------- */

function Pasos({ actual }) {
  return (
    <div className="recuperar-pasos" aria-label={`Paso ${actual} de 3`}>
      {PASOS.map((numero, indice) => {
        const clasePaso =
          numero === actual
            ? 'recuperar-paso recuperar-paso-activo'
            : numero < actual
              ? 'recuperar-paso recuperar-paso-hecho'
              : 'recuperar-paso'

        return (
          <Fragment key={numero}>
            <span className={clasePaso}>{numero}</span>
            {indice < PASOS.length - 1 && (
              <span
                className={
                  numero < actual
                    ? 'recuperar-linea recuperar-linea-hecha'
                    : 'recuperar-linea'
                }
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

/* ---------- Estados implementados como funciones ---------- */

// Paso 1: el correo no está registrado
function EstadoNoRegistrado({ onRegistro }) {
  return (
    <div className="recuperar-alerta" role="alert">
      No encontramos una cuenta registrada con ese correo. Revísalo o{' '}
      <button type="button" className="recuperar-enlace-alerta" onClick={onRegistro}>
        crea una cuenta
      </button>
      .
    </div>
  )
}

// Paso 2: confirmación de envío (mensaje en la misma pantalla)
function EstadoEnvio({ correo, segundos, onReenviar }) {
  return (
    <div className="recuperar-envio">
      <div className="recuperar-envio-icono">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </div>

      <h2>Revisa tu correo</h2>

      <p>
        Enviamos el enlace a <span className="recuperar-mono">{correo}</span>.{' '}
        {segundos > 0 ? (
          <>
            Podrás reenviarlo en{' '}
            <span className="recuperar-mono">{formatearTiempo(segundos)}</span>.
          </>
        ) : (
          <button type="button" className="recuperar-enlace" onClick={onReenviar}>
            Reenviar enlace
          </button>
        )}
      </p>
    </div>
  )
}

// Paso 3: barra de seguridad que cambia según los caracteres
function EstadoSeguridad({ contrasena }) {
  const { nivel, etiqueta, porcentaje } = evaluarSeguridad(contrasena)

  return (
    <div className="recuperar-seguridad" aria-live="polite">
      <div className="recuperar-barra">
        <div
          className={`recuperar-barra-relleno recuperar-nivel-${nivel}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className={`recuperar-etiqueta recuperar-texto-${nivel}`}>
        {etiqueta}
      </span>
    </div>
  )
}

// Paso 3: error al guardar
function EstadoErrorGuardado() {
  return (
    <div className="recuperar-alerta" role="alert">
      No se pudo actualizar la contraseña. Inténtalo de nuevo.
    </div>
  )
}

// Paso 3: contraseña actualizada
function EstadoGuardada({ onLogin }) {
  return (
    <div className="recuperar-envio">
      <div className="recuperar-envio-icono recuperar-icono-exito">✓</div>
      <h2>Contraseña actualizada</h2>
      <p>
        Ya puedes iniciar sesión con tu nueva contraseña. Te llevaremos al
        inicio de sesión en unos segundos.
      </p>
      <button type="button" className="recuperar-btn" onClick={onLogin}>
        Ir a iniciar sesión
      </button>
    </div>
  )
}

/* ---------- Página ---------- */

function RecuperarContrasena() {
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1)
  const [correo, setCorreo] = useState('')
  const [errorCorreo, setErrorCorreo] = useState('')
  const [noRegistrado, setNoRegistrado] = useState(false)

  const [segundos, setSegundos] = useState(ESPERA_REENVIO)
  const [envios, setEnvios] = useState(0)

  const [contrasena, setContrasena] = useState('')
  const [errorContrasena, setErrorContrasena] = useState('')
  const [falloGuardado, setFalloGuardado] = useState(false)
  const [guardada, setGuardada] = useState(false)

  // Paso 2: cuenta regresiva para poder reenviar el enlace
  useEffect(() => {
    if (paso !== 2) return

    const intervalo = setInterval(
      () => setSegundos((s) => Math.max(s - 1, 0)),
      1000
    )
    return () => clearInterval(intervalo)
  }, [paso, envios])

  // Paso 2: simula la llegada de la señal y pasa al paso 3
  useEffect(() => {
    if (paso !== 2) return

    const temporizador = setTimeout(
      () => setPaso(3),
      SEGUNDOS_HASTA_ENLACE * 1000
    )
    return () => clearTimeout(temporizador)
  }, [paso, envios])

  // Paso 3: tras guardar, lleva al login
  useEffect(() => {
    if (!guardada) return

    const temporizador = setTimeout(() => navigate('/login'), 3000)
    return () => clearTimeout(temporizador)
  }, [guardada, navigate])

  const iniciarEnvio = () => {
    setSegundos(ESPERA_REENVIO)
    setEnvios((n) => n + 1)
    setPaso(2)
  }

  const manejarCorreo = (e) => {
    setCorreo(e.target.value)
    setErrorCorreo('')
    setNoRegistrado(false)
  }

  const enviarEnlace = (e) => {
    e.preventDefault()

    const limpio = correo.trim().toLowerCase()

    if (!limpio) {
      setErrorCorreo('Ingresa tu correo institucional.')
      return
    }

    if (!REGEX_CORREO.test(limpio)) {
      setErrorCorreo(`Debe terminar en ${DOMINIO}`)
      return
    }

    let registrado = false
    try {
      registrado = existeCuenta(limpio)
    } catch (error) {
      console.error('Error al leer las cuentas:', error)
    }

    if (!registrado) {
      setNoRegistrado(true)
      return
    }

    setCorreo(limpio)
    iniciarEnvio()
  }

  const manejarContrasena = (e) => {
    setContrasena(e.target.value)
    setErrorContrasena('')
    setFalloGuardado(false)
  }

  const guardarContrasena = (e) => {
    e.preventDefault()

    if (!cumpleRequisitos(contrasena)) {
      setErrorContrasena('Mínimo 8 caracteres, una mayúscula y un número.')
      return
    }

    try {
      const respuesta = actualizarContrasena(correo, contrasena)

      if (!respuesta.ok) {
        setFalloGuardado(true)
        return
      }

      setGuardada(true)
    } catch (error) {
      console.error('Error al guardar la contraseña:', error)
      setFalloGuardado(true)
    }
  }

  return (
    <>
      <HeaderVisitante />

      <main className="recuperar-main">
        <div className="recuperar-card">
          <Pasos actual={paso} />

          {paso === 1 && (
            <form onSubmit={enviarEnlace} noValidate>
              <h1>Recupera tu acceso</h1>
              <p className="recuperar-subtitulo">
                Te enviaremos un enlace para crear una contraseña nueva. El
                enlace expira en 60 minutos.
              </p>

              {noRegistrado && (
                <EstadoNoRegistrado onRegistro={() => navigate('/register')} />
              )}

              <div className="recuperar-campo">
                <label htmlFor="correo">Correo institucional</label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="username"
                  placeholder={`nombre${DOMINIO}`}
                  value={correo}
                  onChange={manejarCorreo}
                  className={errorCorreo ? 'recuperar-input-error' : ''}
                />
                {errorCorreo && <p className="recuperar-error">{errorCorreo}</p>}
              </div>

              <button type="submit" className="recuperar-btn">
                Enviar enlace
              </button>

              <p className="recuperar-pie">
                <button
                  type="button"
                  className="recuperar-enlace"
                  onClick={() => navigate('/login')}
                >
                  Volver al inicio de sesión
                </button>
              </p>
            </form>
          )}

          {paso === 2 && (
            <EstadoEnvio
              correo={correo}
              segundos={segundos}
              onReenviar={iniciarEnvio}
            />
          )}

          {paso === 3 && !guardada && (
            <form onSubmit={guardarContrasena} noValidate>
              <h1>Crea tu nueva contraseña</h1>
              <p className="recuperar-subtitulo">
                Elige una contraseña segura para tu cuenta.
              </p>

              {falloGuardado && <EstadoErrorGuardado />}

              <div className="recuperar-campo">
                <label htmlFor="contrasena">Nueva contraseña</label>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  autoComplete="new-password"
                  value={contrasena}
                  onChange={manejarContrasena}
                  className={errorContrasena ? 'recuperar-input-error' : ''}
                />

                <EstadoSeguridad contrasena={contrasena} />

                {errorContrasena ? (
                  <p className="recuperar-error">{errorContrasena}</p>
                ) : (
                  <p className="recuperar-ayuda">
                    Mínimo 8 caracteres, una mayúscula y un número.
                  </p>
                )}
              </div>

              <button type="submit" className="recuperar-btn">
                Guardar contraseña
              </button>
            </form>
          )}

          {paso === 3 && guardada && (
            <EstadoGuardada onLogin={() => navigate('/login')} />
          )}
        </div>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default RecuperarContrasena
import './LoginPage.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderVisitante from '../../components/Header/Header-Visitante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import { iniciarSesion } from '../../data/cuentas'

const DOMINIO = '@aloe.ulima.edu.pe o @ulima.edu.pe'
const REGEX_CORREO = /^[^\s@]+@(?:aloe\.)?ulima\.edu\.pe$/i
const CLAVE_CORREO_RECORDADO = 'correoRecordado'

function leerCorreoRecordado() {
  try {
    return localStorage.getItem(CLAVE_CORREO_RECORDADO) || ''
  } catch {
    return ''
  }
}

function validar(correo, contrasena) {
  const errores = {}

  if (!correo.trim()) {
    errores.correo = 'Ingresa tu correo institucional.'
  } else if (!REGEX_CORREO.test(correo.trim())) {
    errores.correo = `Debe terminar en ${DOMINIO}`
  }

  if (!contrasena) {
    errores.contrasena = 'Ingresa tu contraseña.'
  }

  return errores
}

/* ---------- Estados implementados como funciones ---------- */

// Estado: correo o contraseña incorrectos (cuenta no registrada)
function EstadoCredenciales({ onRegistro }) {
  return (
    <div className="login-alerta" role="alert">
      Correo o contraseña incorrectos. Si aún no tienes cuenta,{' '}
      <button type="button" className="login-enlace-alerta" onClick={onRegistro}>
        créala aquí
      </button>
      .
    </div>
  )
}

// Estado: error inesperado al leer las cuentas
function EstadoError() {
  return (
    <div className="login-alerta" role="alert">
      No se pudo iniciar sesión en este navegador. Revisa que el
      almacenamiento local esté habilitado e inténtalo de nuevo.
    </div>
  )
}

// Estado: cuenta bloqueada por deuda (puede entrar, pero no solicitar)
function EstadoDeuda({ deuda }) {
  return (
    <>
      <div className="login-alerta" role="alert">
        Cuenta bloqueada: penalidad pendiente de{' '}
        <strong>S/ {Number(deuda.monto).toFixed(2)}</strong> por el préstamo{' '}
        <strong>{deuda.prestamo}</strong>.
      </div>
      <p className="login-nota">
        Puedes ingresar para ver tu historial, pero no solicitarás equipos
        hasta regularizar en Tesorería.
      </p>
    </>
  )
}

/* ---------- Página ---------- */

function LoginPage() {
  const navigate = useNavigate()

  const [correo, setCorreo] = useState(leerCorreoRecordado)
  const [contrasena, setContrasena] = useState('')
  const [recordar, setRecordar] = useState(() => leerCorreoRecordado() !== '')
  const [errores, setErrores] = useState({})
  const [estado, setEstado] = useState(null) // null | 'credenciales' | 'error' | 'deuda'
  const [cargando, setCargando] = useState(false)
  const [deuda, setDeuda] = useState(null)
  const [bloqueo, setBloqueo] = useState(null)

  const manejarCorreo = (e) => {
    setCorreo(e.target.value)
    setEstado(null)
    if (errores.correo) setErrores({ ...errores, correo: undefined })
  }

  const manejarContrasena = (e) => {
    setContrasena(e.target.value)
    setEstado(null)
    if (errores.contrasena) setErrores({ ...errores, contrasena: undefined })
  }

  const manejarSubmit = (e) => {
    e.preventDefault()
    if (cargando) return
    setEstado(null)

    const nuevosErrores = validar(correo, contrasena)
    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) return

    setCargando(true)

    // pequeña espera para que se vea el estado "Ingresando..."
    setTimeout(() => {
      try {
        const respuesta = iniciarSesion(correo, contrasena)

        if (!respuesta.ok) {
          setCargando(false)
          if (respuesta.motivo === 'bloqueada') { setBloqueo(respuesta); setEstado('bloqueada') }
          else setEstado('credenciales')
          return
        }

        try {
          if (recordar) {
            localStorage.setItem(CLAVE_CORREO_RECORDADO, correo.trim().toLowerCase())
          } else {
            localStorage.removeItem(CLAVE_CORREO_RECORDADO)
          }
        } catch {
          // sin almacenamiento: se ignora
        }

        if (respuesta.cuenta.deuda) {
          setDeuda(respuesta.cuenta.deuda)
          setCargando(false)
          setEstado('deuda')
          return
        }

        navigate(respuesta.cuenta.rol === 'encargado' ? '/encargado/inventario' : '/cuenta')
      } catch (error) {
        console.error('Error al iniciar sesión:', error)
        setCargando(false)
        setEstado('error')
      }
    }, 800)
  }

  return (
    <>
      <HeaderVisitante />

      <main className="login-main">
        <form className="login-card" onSubmit={manejarSubmit} noValidate>
          <h1>Inicia sesión</h1>
          <button type="button" className="login-registro-encargado" onClick={() => navigate('/registroencargado')}>Registrar encargado</button>
          <p className="login-subtitulo">
            Usa tu correo institucional para solicitar y seguir tus préstamos.
          </p>

          {estado === 'credenciales' && (
            <EstadoCredenciales onRegistro={() => navigate('/register')} />
          )}

          {estado === 'error' && <EstadoError />}
          {estado === 'bloqueada' && <div className="login-alerta" role="alert"><strong>Cuenta bloqueada.</strong><p>Motivo: {bloqueo?.razon}</p>{bloqueo?.detalle && <p>{bloqueo.detalle}</p>}</div>}

          {estado === 'deuda' && <EstadoDeuda deuda={deuda} />}

          <div className="login-campo">
            <label htmlFor="correo">Correo institucional</label>
            <input
              id="correo"
              name="correo"
              type="email"
              autoComplete="username"
              placeholder={`tucorreo${DOMINIO}`}
              value={correo}
              onChange={manejarCorreo}
              disabled={cargando}
              className={errores.correo ? 'login-input-error' : ''}
            />
            {errores.correo && <p className="login-error">{errores.correo}</p>}
          </div>

          <div className="login-campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={manejarContrasena}
              disabled={cargando}
              className={errores.contrasena ? 'login-input-error' : ''}
            />
            {errores.contrasena && (
              <p className="login-error">{errores.contrasena}</p>
            )}
          </div>

          <div className="login-extra">
            <label className="login-check">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                disabled={cargando}
              />
              <span>Recordarme</span>
            </label>

            <button
              type="button"
              className="login-enlace"
              onClick={() => navigate('/recuperar')}
              disabled={cargando}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {estado === 'deuda' ? (
            <button
              type="button"
              className="login-btn"
              onClick={() => navigate('/cuenta')}
            >
              Continuar a mi cuenta
            </button>
          ) : (
            <button type="submit" className="login-btn" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          )}

          <p className="login-pie">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              className="login-enlace"
              onClick={() => navigate('/register')}
              disabled={cargando}
            >
              Crear cuenta
            </button>
          </p>
        </form>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default LoginPage
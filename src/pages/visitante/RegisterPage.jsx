import './RegisterPage.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderVisitante from '../../components/Header/Header-Visitante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import { registrarCuenta } from '../../data/cuentas'

const DOMINIO = '@aloe.ulima.edu.pe'
const REGEX_CORREO = /^[^\s@]+@aloe\.ulima\.edu\.pe$/i

const CARRERAS = [
  'Ingeniería Civil',
  'Ingeniería Electrónica',
  'Ingeniería Industrial',
  'Ingeniería de Sistemas'
]

const CICLOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const FORM_INICIAL = {
  nombres: '',
  apellidos: '',
  carrera: '',
  ciclo: '',
  correo: '',
  contrasena: '',
  confirmar: '',
  acepta: false
}

function validar(datos) {
  const errores = {}

  if (!datos.nombres.trim()) errores.nombres = 'Ingresa tus nombres.'
  if (!datos.apellidos.trim()) errores.apellidos = 'Ingresa tus apellidos.'
  if (!datos.carrera) errores.carrera = 'Selecciona tu carrera.'
  if (!datos.ciclo) errores.ciclo = 'Selecciona tu ciclo.'

  if (!datos.correo.trim()) {
    errores.correo = 'Ingresa tu correo institucional.'
  } else if (!REGEX_CORREO.test(datos.correo.trim())) {
    errores.correo = `Debe terminar en ${DOMINIO}`
  }

  const clave = datos.contrasena
  if (!clave) {
    errores.contrasena = 'Ingresa una contraseña.'
  } else if (clave.length < 8 || !/[A-Z]/.test(clave) || !/[0-9]/.test(clave)) {
    errores.contrasena = 'Mínimo 8 caracteres, una mayúscula y un número.'
  }

  if (!datos.confirmar) {
    errores.confirmar = 'Confirma tu contraseña.'
  } else if (datos.confirmar !== clave) {
    errores.confirmar = 'Las contraseñas no coinciden.'
  }

  if (!datos.acepta) {
    errores.acepta = 'Debes aceptar el reglamento para continuar.'
  }

  return errores
}

/* ---------- Campo reutilizable ---------- */

function Campo({ id, etiqueta, ayuda, error, children }) {
  return (
    <div className="registro-campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? (
        <p className="registro-error">{error}</p>
      ) : (
        ayuda && <p className="registro-ayuda">{ayuda}</p>
      )}
    </div>
  )
}

/* ---------- Estados implementados como funciones ---------- */

// Estado: validación en línea (resumen de campos con error)
function EstadoValidacion({ cantidad }) {
  if (cantidad === 0) return null

  return (
    <p className="registro-resumen-error">
      Revisa {cantidad} {cantidad === 1 ? 'campo' : 'campos'} antes de continuar.
    </p>
  )
}

// Estado: notificación de resultado (correo ya registrado)
function EstadoDuplicado({ correo, onLogin, onRecuperar }) {
  return (
    <div className="registro-alerta" role="alert">
      Ya existe una cuenta con el correo{' '}
      <span className="registro-mono">{correo}</span>.{' '}
      <button type="button" className="registro-enlace" onClick={onLogin}>
        Inicia sesión
      </button>{' '}
      o{' '}
      <button type="button" className="registro-enlace" onClick={onRecuperar}>
        recupera tu contraseña
      </button>
      .
    </div>
  )
}

// Estado: error al guardar la cuenta
function EstadoErrorGuardado() {
  return (
    <div className="registro-alerta" role="alert">
      No se pudo guardar la cuenta en este navegador. Revisa que el
      almacenamiento local esté habilitado e inténtalo de nuevo.
    </div>
  )
}

// Estado: éxito (cuenta creada)
function EstadoExito({ correo, onLogin }) {
  return (
    <div className="registro-exito">
      <div className="registro-exito-icono">✓</div>
      <h2>Cuenta creada</h2>
      <p>
        Enviamos un enlace de verificación a{' '}
        <span className="registro-mono">{correo}</span>. Válido por 24 horas.
        Te llevaremos al inicio de sesión en unos segundos.
      </p>
      <button
        type="button"
        className="registro-btn-primario"
        onClick={onLogin}
      >
        Iniciar sesión
      </button>
    </div>
  )
}

/* ---------- Página ---------- */

function Register() {
  const navigate = useNavigate()

  const [datos, setDatos] = useState(FORM_INICIAL)
  const [errores, setErrores] = useState({})
  const [intentado, setIntentado] = useState(false)
  const [resultado, setResultado] = useState(null) // null | 'exito' | 'duplicado' | 'error'
  const [correoRegistrado, setCorreoRegistrado] = useState('')

  // Al crear la cuenta, lleva al login a los 3 segundos
  useEffect(() => {
    if (resultado !== 'exito') return

    const temporizador = setTimeout(() => navigate('/login'), 3000)
    return () => clearTimeout(temporizador)
  }, [resultado, navigate])

  const claseInput = (campo) => (errores[campo] ? 'registro-input-error' : '')

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target
    const nuevos = { ...datos, [name]: type === 'checkbox' ? checked : value }

    setDatos(nuevos)

    if (intentado) setErrores(validar(nuevos))

    if (
      resultado === 'error' ||
      (name === 'correo' && resultado === 'duplicado')
    ) {
      setResultado(null)
    }
  }

  const manejarSubmit = (e) => {
    e.preventDefault()
    setIntentado(true)

    const nuevosErrores = validar(datos)
    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0) {
      setResultado(null)
      return
    }

    const correo = datos.correo.trim().toLowerCase()

    try {
      const respuesta = registrarCuenta(datos)
      setCorreoRegistrado(correo)
      setResultado(respuesta.ok ? 'exito' : 'duplicado')
    } catch (error) {
      console.error('Error al registrar la cuenta:', error)
      setResultado('error')
    }
  }

  return (
    <>
      <HeaderVisitante />

      <main className="registro-main">
        {resultado === 'exito' ? (
          <EstadoExito
            correo={correoRegistrado}
            onLogin={() => navigate('/login')}
          />
        ) : (
          <form className="registro-card" onSubmit={manejarSubmit} noValidate>
            <h1>Crea tu cuenta de estudiante</h1>
            <p className="registro-subtitulo">
              Solo se admiten correos {DOMINIO}. La cuenta se activa con el
              enlace de verificación.
            </p>

            {resultado === 'duplicado' && (
              <EstadoDuplicado
                correo={correoRegistrado}
                onLogin={() => navigate('/login')}
                onRecuperar={() => navigate('/recuperar')}
              />
            )}

            {resultado === 'error' && <EstadoErrorGuardado />}

            <h2 className="registro-seccion">Datos personales</h2>

            <div className="registro-fila">
              <Campo id="nombres" etiqueta="Nombres" error={errores.nombres}>
                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  value={datos.nombres}
                  onChange={manejarCambio}
                  className={claseInput('nombres')}
                />
              </Campo>

              <Campo id="apellidos" etiqueta="Apellidos" error={errores.apellidos}>
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  value={datos.apellidos}
                  onChange={manejarCambio}
                  className={claseInput('apellidos')}
                />
              </Campo>
            </div>

            <div className="registro-fila">
              <Campo id="carrera" etiqueta="Carrera" error={errores.carrera}>
                <select
                  id="carrera"
                  name="carrera"
                  value={datos.carrera}
                  onChange={manejarCambio}
                  className={claseInput('carrera')}
                >
                  <option value="">Selecciona tu carrera</option>
                  {CARRERAS.map((carrera) => (
                    <option key={carrera} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id="ciclo" etiqueta="Ciclo" error={errores.ciclo}>
                <select
                  id="ciclo"
                  name="ciclo"
                  value={datos.ciclo}
                  onChange={manejarCambio}
                  className={claseInput('ciclo')}
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

            <h2 className="registro-seccion">Acceso</h2>

            <div className="registro-fila registro-fila-una">
              <Campo
                id="correo"
                etiqueta="Correo institucional"
                ayuda={`Debe terminar en ${DOMINIO}`}
                error={errores.correo}
              >
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  placeholder={`nombre${DOMINIO}`}
                  value={datos.correo}
                  onChange={manejarCambio}
                  className={claseInput('correo')}
                />
              </Campo>
            </div>

            <div className="registro-fila">
              <Campo
                id="contrasena"
                etiqueta="Contraseña"
                ayuda="Mínimo 8 caracteres, una mayúscula y un número."
                error={errores.contrasena}
              >
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  autoComplete="new-password"
                  value={datos.contrasena}
                  onChange={manejarCambio}
                  className={claseInput('contrasena')}
                />
              </Campo>

              <Campo
                id="confirmar"
                etiqueta="Confirmar contraseña"
                error={errores.confirmar}
              >
                <input
                  id="confirmar"
                  name="confirmar"
                  type="password"
                  autoComplete="new-password"
                  value={datos.confirmar}
                  onChange={manejarCambio}
                  className={claseInput('confirmar')}
                />
              </Campo>
            </div>

            <label className="registro-check">
              <input
                type="checkbox"
                name="acepta"
                checked={datos.acepta}
                onChange={manejarCambio}
              />
              <span>
                Acepto el reglamento de préstamo de equipos y me responsabilizo
                por el cuidado y la devolución de las unidades asignadas.
              </span>
            </label>
            {errores.acepta && <p className="registro-error">{errores.acepta}</p>}

            <div className="registro-acciones">
              <EstadoValidacion cantidad={Object.keys(errores).length} />

              <button
                type="button"
                className="registro-btn-secundario"
                onClick={() => navigate('/')}
              >
                Cancelar
              </button>

              <button type="submit" className="registro-btn-primario">
                Crear cuenta
              </button>
            </div>
          </form>
        )}
      </main>

      <FooterEstudiante />
    </>
  )
}

export default Register
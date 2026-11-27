import '../estudiante/Cuenta.css'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import HeaderEncargado from '../Header/Header-Encargado'
import FooterEncargado from '../Footer/Footer-Encargado'
import { obtenerSesion, cambiarContrasena } from '../../data/cuentas'
import { obtenerEncargado, actualizarEncargado } from '../../data/Encargadosstorage'

// Copia aquí la lista completa de ALMACENES de RegistroEncargado.jsx
const ALMACENES = [
  'Almacén H-102',
  'Almacén N-005',
]

const CLAVE_INICIAL = { actual: '', nueva: '', confirmar: '' }

function cumpleRequisitos(clave) {
  return clave.length >= 8 && /[A-Z]/.test(clave) && /[0-9]/.test(clave)
}

function datosDesdeCuenta(cuenta) {
  return {
    nombres: cuenta?.nombres || '',
    apellidos: cuenta?.apellidos || '',
    almacen: cuenta?.almacen || '',
    anexo: cuenta?.anexo || ''
  }
}

function validarPerfil(datos) {
  const errores = {}

  if (!datos.nombres.trim()) errores.nombres = 'Ingresa tus nombres.'
  if (!datos.apellidos.trim()) errores.apellidos = 'Ingresa tus apellidos.'
  if (!datos.almacen) errores.almacen = 'Selecciona tu almacén.'
  if (!/^\d{4}$/.test(datos.anexo.trim())) {
    errores.anexo = 'El anexo debe tener 4 dígitos.'
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

function CuentaEncargado() {
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerEncargado(sesion.correo) : null

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

  /* ----- Datos personales ----- */

  const cambiarDato = (e) => {
    const { name, value } = e.target
    const nuevoValor =
      name === 'anexo' ? value.replace(/\D/g, '').slice(0, 4) : value

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
      const respuesta = actualizarEncargado(cuenta.correo, datos)

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
      <HeaderEncargado correo={cuenta.correo} />

      <main className="micuenta-main">
        <p className="micuenta-ruta">Inicio / Mi cuenta</p>
        <h1>Mi cuenta</h1>

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

              <Campo id="apellidos" etiqueta="Apellidos" error={erroresPerfil.apellidos}>
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
              <Campo id="almacen" etiqueta="Almacén asignado" error={erroresPerfil.almacen}>
                <select
                  id="almacen"
                  name="almacen"
                  value={datos.almacen}
                  onChange={cambiarDato}
                  className={claseInput(erroresPerfil, 'almacen')}
                >
                  <option value="">Selecciona tu almacén</option>
                  {ALMACENES.map((almacen) => (
                    <option key={almacen} value={almacen}>
                      {almacen}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id="anexo" etiqueta="Anexo telefónico" error={erroresPerfil.anexo}>
                <input
                  id="anexo"
                  name="anexo"
                  type="tel"
                  inputMode="numeric"
                  placeholder="1234"
                  value={datos.anexo}
                  onChange={cambiarDato}
                  className={`micuenta-mono-input ${claseInput(erroresPerfil, 'anexo')}`}
                />
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

          {/* ----- Cambiar contraseña ----- */}
          <div className="micuenta-columna">
            <form className="micuenta-card" onSubmit={actualizarClave} noValidate>
              <h2>Cambiar contraseña</h2>

              <div className="micuenta-fila micuenta-fila-una">
                <Campo id="actual" etiqueta="Contraseña actual" error={erroresClave.actual}>
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
          </div>
        </div>
      </main>

      <FooterEncargado correo={cuenta.correo} />
    </>
  )
}

export default CuentaEncargado
import { useState } from 'react'
import HeaderVisitante from '../../components/Header/Header-Visitante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'
import { registrarEncargado, correoYaRegistrado } from '../../data/Encargadosstorage'
import './RegistroEncargado.css'

const ALMACENES = [
  'Almacén H-102',
  'Almacén N-005',
  'Laboratorio de Electrónica H-210',
]

const DOMINIO = '@ulima.edu.pe'

const FORM_INICIAL = {
  nombres: '',
  apellidos: '',
  correo: '',
  contrasena: '',
  confirmarContrasena: '',
  almacen: ALMACENES[0],
  anexo: '',
}

function validar(form) {
  const errores = {}

  if (!form.nombres.trim()) errores.nombres = 'Ingresa tus nombres.'
  if (!form.apellidos.trim()) errores.apellidos = 'Ingresa tus apellidos.'

  if (!form.correo.trim()) {
    errores.correo = 'Ingresa tu correo institucional.'
  } else if (!form.correo.trim().toLowerCase().endsWith(DOMINIO)) {
    errores.correo = `El correo debe terminar en ${DOMINIO}`
  } else if (form.correo.trim().length <= DOMINIO.length) {
    errores.correo = 'Escribe tu usuario antes del dominio.'
  } else if (correoYaRegistrado(form.correo)) {
    errores.correo = 'Este correo ya tiene un registro.'
  }

  if (form.contrasena.length < 8 || !/[A-Z]/.test(form.contrasena) || !/\d/.test(form.contrasena)) {
    errores.contrasena = 'Mínimo 8 caracteres, una mayúscula y un número.'
  }

  if (form.confirmarContrasena !== form.contrasena) {
    errores.confirmarContrasena = 'Las contraseñas no coinciden.'
  }

  if (!/^\d{4}$/.test(form.anexo.trim())) {
    errores.anexo = 'El anexo debe tener 4 dígitos.'
  }

  return errores
}

export default function RegistroEncargado() {
  const [form, setForm] = useState(FORM_INICIAL)
  const [errores, setErrores] = useState({})
  const [registrado, setRegistrado] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevosErrores = validar(form)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    // Guarda todos los datos en encargadosStorage.js
    registrarEncargado(form)
    setRegistrado(true)
    setForm(FORM_INICIAL)
  }

  const handleCancelar = () => {
    setForm(FORM_INICIAL)
    setErrores({})
    window.history.back()
  }

  const claseCampo = (nombre) => `re-input${errores[nombre] ? ' re-input--error' : ''}`

  return (
    <div className="re-page">
      <HeaderVisitante />

      <main className="re-main">
        <form className="re-card" onSubmit={handleSubmit} noValidate>
          <h1 className="re-title">Registro de encargado de almacén</h1>
          <p className="re-subtitle">
            El alta queda pendiente hasta que el jefe de laboratorio la apruebe. Solo se admiten
            correos @ulima.edu.pe del personal.
          </p>

          {registrado && (
            <div className="re-alert re-alert--ok" role="status">
              Registro enviado. Tu cuenta quedó en estado «Pendiente de aprobación».
            </div>
          )}

          {/* DATOS PERSONALES */}
          <fieldset className="re-section">
            <legend className="re-section-title">Datos personales</legend>
            <div className="re-row">
              <div className="re-field">
                <label className="re-label" htmlFor="nombres">Nombres</label>
                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  className={claseCampo('nombres')}
                  value={form.nombres}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
                {errores.nombres && <span className="re-error">{errores.nombres}</span>}
              </div>

              <div className="re-field">
                <label className="re-label" htmlFor="apellidos">Apellidos</label>
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  className={claseCampo('apellidos')}
                  value={form.apellidos}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
                {errores.apellidos && <span className="re-error">{errores.apellidos}</span>}
              </div>
            </div>
          </fieldset>

          {/* ACCESO */}
          <fieldset className="re-section">
            <legend className="re-section-title">Acceso</legend>

            <div className="re-field">
              <label className="re-label" htmlFor="correo">Correo institucional</label>
              <input
                id="correo"
                name="correo"
                type="email"
                className={claseCampo('correo')}
                value={form.correo}
                onChange={handleChange}
                autoComplete="email"
              />
              {errores.correo ? (
                <span className="re-error">{errores.correo}</span>
              ) : (
                <span className="re-hint">Debe terminar en @ulima.edu.pe</span>
              )}
            </div>

            <div className="re-row">
              <div className="re-field">
                <label className="re-label" htmlFor="contrasena">Contraseña</label>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  className={claseCampo('contrasena')}
                  value={form.contrasena}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {errores.contrasena ? (
                  <span className="re-error">{errores.contrasena}</span>
                ) : (
                  <span className="re-hint">Mínimo 8 caracteres, una mayúscula y un número.</span>
                )}
              </div>

              <div className="re-field">
                <label className="re-label" htmlFor="confirmarContrasena">Confirmar contraseña</label>
                <input
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  type="password"
                  className={claseCampo('confirmarContrasena')}
                  value={form.confirmarContrasena}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {errores.confirmarContrasena && (
                  <span className="re-error">{errores.confirmarContrasena}</span>
                )}
              </div>
            </div>
          </fieldset>

          {/* ASIGNACIÓN */}
          <fieldset className="re-section">
            <legend className="re-section-title">Asignación</legend>
            <div className="re-row">
              <div className="re-field">
                <label className="re-label" htmlFor="almacen">Almacén asignado</label>
                <select
                  id="almacen"
                  name="almacen"
                  className="re-input re-select"
                  value={form.almacen}
                  onChange={handleChange}
                >
                  {ALMACENES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <span className="re-hint">Opciones: {ALMACENES.join(', ')}.</span>
              </div>

              <div className="re-field">
                <label className="re-label" htmlFor="anexo">Anexo telefónico</label>
                <input
                  id="anexo"
                  name="anexo"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  className={claseCampo('anexo')}
                  value={form.anexo}
                  onChange={handleChange}
                />
                {errores.anexo && <span className="re-error">{errores.anexo}</span>}
              </div>
            </div>
          </fieldset>

          <div className="re-alert re-alert--warn" role="note">
            La cuenta se crea en estado «Pendiente de aprobación». Hasta entonces no podrá aprobar
            solicitudes ni registrar entregas.
          </div>

          <div className="re-actions">
            <button type="button" className="re-btn re-btn--outline" onClick={handleCancelar}>
              Cancelar
            </button>
            <button type="submit" className="re-btn re-btn--primary">
              Registrar encargado
            </button>
          </div>
        </form>
      </main>

      <FooterEstudiante />
    </div>
  )
}
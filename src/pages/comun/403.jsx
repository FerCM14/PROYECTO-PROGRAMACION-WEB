import './403.css'
import { useNavigate } from 'react-router-dom'
import HeaderEstudiante from '../../components/Header/Header-Estudiante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'

const CORREO_SOPORTE = 'almacen.equipos@ulima.edu.pe'

function Error403() {
  const navigate = useNavigate()

  return (
    <>
      <HeaderEstudiante />

      <main className="error403-main">
        <section className="error403-contenido">
          <div className="error403-icono" aria-hidden="true">
            !
          </div>

          <p className="error403-codigo">ERROR 403 · ACCESO DENEGADO</p>

          <h1>No tienes permiso para ver esta página</h1>

          <p className="error403-texto">
            Esta sección pertenece al panel del encargado de almacén. Si crees
            que es un error, escribe a{' '}
            <a href={`mailto:${CORREO_SOPORTE}`}>{CORREO_SOPORTE}</a> indicando
            tu código de estudiante.
          </p>

          <div className="error403-acciones">
            <button
              type="button"
              className="error403-btn-primario"
              onClick={() => navigate('/catalogo')}
            >
              Ir al catálogo
            </button>

            <button
              type="button"
              className="error403-btn-secundario"
              onClick={() => navigate('/solicitudes')}
            >
              Ver mis solicitudes
            </button>
          </div>
        </section>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default Error403
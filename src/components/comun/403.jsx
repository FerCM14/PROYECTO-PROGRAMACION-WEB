import './403.css'
import { useNavigate } from 'react-router-dom'
import HeaderEstudiante from '../Header/Header-Estudiante'
import FooterEstudiante from '../Footer/Footer-Estudiante'

const CORREO_SOPORTE = 'almacen.equipos@ulima.edu.pe'

const CONTENIDO = {
  estudiante: {
    texto: 'Esta sección pertenece al panel del encargado de almacén.',
    principal: { texto: 'Ir al catálogo', ruta: '/catalogo' },
    secundario: {
      texto: 'Ver mis solicitudes',
      ruta: '/estudiante/mis-solicitudes',
    },
  },
  encargado: {
    texto: 'Esta sección es exclusiva para estudiantes.',
    principal: {
      texto: 'Ir al inventario',
      ruta: '/encargado/inventario',
    },
    secundario: {
      texto: 'Ver solicitudes',
      ruta: '/encargado/aprobacion-entrega',
    },
  },
  visitante: {
    texto: 'Debes iniciar sesión para ver esta sección.',
    principal: { texto: 'Iniciar sesión', ruta: '/login' },
    secundario: { texto: 'Ver catálogo', ruta: '/catalogo' },
  },
}

function Error403() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const rol = usuario?.rol ?? 'visitante'
  const contenido = CONTENIDO[rol] ?? CONTENIDO.visitante

  const Header =
    rol === 'encargado' ? HeaderEncargado : HeaderEstudiante

  const Footer =
    rol === 'encargado' ? FooterEncargado : FooterEstudiante

  return (
    <>
      <Header />

      <main className="error403-main">
        <section className="error403-contenido">
          <div className="error403-icono" aria-hidden="true">
            !
          </div>

          <p className="error403-codigo">
            ERROR 403 · ACCESO DENEGADO
          </p>

          <h1>No tienes permiso para ver esta página</h1>
          <p className="error403-texto">
            {contenido.texto} Si crees que es un error, escribe a{' '}
            <a href={`mailto:${CORREO_SOPORTE}`}>
              {CORREO_SOPORTE}
            </a>{' '}
            indicando tu código de estudiante.
          </p>
          <div className="error403-acciones">
            <button
              type="button"
              className="error403-btn-primario"
              onClick={() => navigate(contenido.principal.ruta)}
            >
              {contenido.principal.texto}
            </button>

            <button
              type="button"
              className="error403-btn-secundario"
              onClick={() => navigate(contenido.secundario.ruta)}
            >
              {contenido.secundario.texto}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Error403
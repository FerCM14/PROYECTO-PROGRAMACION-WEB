import './404.css'
import { useNavigate } from 'react-router-dom'
import HeaderVisitante from '../../components/Header/Header-Visitante'
import FooterEstudiante from '../../components/Footer/Footer-Estudiante'

function NotFound() {
  const navigate = useNavigate()

  return (
    <>
      <HeaderVisitante />

      <main className="notfound-main">
        <section className="notfound-contenido">
          <div className="notfound-icono" aria-hidden="true">
            ?
          </div>

          <p className="notfound-codigo">Error 404 · Página no encontrada</p>

          <h1>No encontramos esta página</h1>

          <p className="notfound-texto">
            El enlace pudo cambiar o la ficha del equipo ya no está publicada
            en el catálogo.
          </p>

          <div className="notfound-acciones">
            <button
              type="button"
              className="notfound-btn-primario"
              onClick={() => navigate('/')}
            >
              Ir al inicio
            </button>

            <button
              type="button"
              className="notfound-btn-secundario"
              onClick={() => navigate('/catalogo')}
            >
              Buscar un equipo
            </button>
          </div>
        </section>
      </main>

      <FooterEstudiante />
    </>
  )
}

export default NotFound
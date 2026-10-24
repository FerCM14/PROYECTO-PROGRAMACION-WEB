import './Header-Visitante.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HeaderVisitante() {
  const navigate = useNavigate()
  const [ayuda, setAyuda] = useState(false)

  return (
    <header className="header-visitante">
      <nav className="nav">
        <div className="logo">
          <button
            className="logo-button"
            onClick={() => navigate('/')}
          >
            <div className="cuadro-verde"></div>
            <span>Almacén de Equipos</span>
          </button>
        </div>

        <button onClick={() => navigate('/pubicpage:/1')}>
          Inicio
        </button>

        <button onClick={() => navigate('/catalogo')}>
          Catálogo
        </button>

        <button onClick={() => navigate('/reserva-anticipada')}>
          Reglas del préstamo
        </button>

        <button aria-expanded={ayuda} onClick={() => setAyuda(!ayuda)}>
          Ayuda
        </button>

        <button
          className="Iniciar"
          onClick={() => navigate('/login')}
        >
          Iniciar sesión
        </button>

        <button
          className="Created"
          onClick={() => navigate('/register')}
        >
          Crear cuenta
        </button>
      </nav>
      {ayuda && <div className="hdr-vis-ayuda" role="status">Contacto de soporte: <a href="mailto:sistemas@ulima.edu.pe">sistemas@ulima.edu.pe</a></div>}
    </header>
  )
}

export default HeaderVisitante
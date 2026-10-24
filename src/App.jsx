import './App.css'
import { useNavigate } from 'react-router-dom'
import HeaderVisitante from './components/Header/Header-Visitante'
import FooterVisitante from './components/Footer/Footer-Visitante'
import { equiposDestacados, pasosPrestamo } from './data/datosVisitante'

function App() {
  const navigate = useNavigate()

  return (
    <>
      <HeaderVisitante />

      <main>
        <section className="Grande">
          <div className="Grande-content">
            <div className="Grande-text">
              <h1>
                Reserva el equipo del laboratorio antes de tu práctica
              </h1>

              <p>
                Busca por equipo o categoría, revisa cuántas unidades hay
                libres y solicita el préstamo con tus fechas. Recojo en el
                Almacén H-102.
              </p>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Busca un equipo: «osciloscopio» o «robótica»"
                />

                <button onClick={() => navigate('/catalogo')}>
                  Buscar
                </button>
              </div>
            </div>

            <div className="Grande-image">
              <p>fotografía del almacén · 520 × 300</p>
            </div>
          </div>
        </section>

        <section className="Equipos_des">
          <h2>Equipos destacados</h2>

          <button
            className="ver-catalogo"
            onClick={() => navigate('/catalogo')}
          >
            Ver todo el catálogo →
          </button>

          {equiposDestacados.map((equipo) => (
            <article
              className="Equipos"
              key={equipo.id}
              onClick={() => navigate(`/pubicpage:/${equipo.id}`)}
            >
              <div className="Equipos-img-placeholder">
                {equipo.imagen && (
                  <img
                    src={equipo.imagen}
                    alt={equipo.nombre}
                  />
                )}
              </div>

              <div className="Equipos-info">
                <h3>{equipo.nombre}</h3>

                <p className="sub">
                  {equipo.marca} · {equipo.categoria}
                </p>

                <p className={`status ${equipo.estadoClase}`}>
                  {equipo.unidadesDisponibles} / {equipo.unidadesTotales} libres
                </p>
              </div>
            </article>
          ))}
        </section>

        <section className="Pasos">
          {pasosPrestamo.map((item) => (
            <article
              className="Instrucciones"
              key={item.paso}
            >
              <span className="step-num">
                {item.paso}
              </span>

              <div className="step-content">
                <h6>{item.titulo}</h6>
                <p>{item.descripcion}</p>
              </div>
            </article>
          ))}
        </section>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      </main>

      <FooterVisitante />
    </>
  )
}

export default App
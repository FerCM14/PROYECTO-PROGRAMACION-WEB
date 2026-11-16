import HeaderVisitante from '../Header/Header-Visitante'
import FooterVisitante from '../Footer/Footer-Visitante'
import './ReglasPrestamo.css'

export default function ReglasPrestamo() {
  return <>
    <HeaderVisitante />
    <main className="reglas-prestamo">
      <h1>Reglas del préstamo</h1>
      <p>Consulta las condiciones de cada equipo en el catálogo antes de enviar una solicitud.</p>
      <h2>Solicitud y disponibilidad</h2>
      <p>Inicia sesión con tu cuenta para solicitar equipos. Selecciona las fechas y revisa la disponibilidad del equipo.</p>
      <h2>Condiciones de cada equipo</h2>
      <p>El plazo máximo, la posibilidad de renovación y la autorización requerida dependen del equipo. Revisa su ficha para conocer las condiciones aplicables.</p>
      <h2>Entrega y devolución</h2>
      <p>Consulta el estado de tu solicitud y las fechas acordadas. Al recibir y devolver el equipo se registra su condición y sus accesorios.</p>
      <h2>Consultas</h2>
      <p>Para aclarar las condiciones del préstamo, contacta al almacén: <a href="mailto:almacen.equipos@ulima.edu.pe">almacen.equipos@ulima.edu.pe</a>.</p>
    </main>
    <FooterVisitante />
  </>
}

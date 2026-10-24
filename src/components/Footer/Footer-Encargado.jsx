import { useEffect } from 'react'
import {
  obtenerEncargadoActual,
  datosPerfil,
  registrarSincronizacion,
  useUltimaSincronizacion,
  formatearFecha,
} from '../../data/Panelencargado'
import './Footer-Encargado.css'

/**
 * Props opcionales:
 *  - correo: correo del encargado con sesión iniciada (si no se pasa, usa el último registrado)
 *  - manualHref: enlace del manual del encargado
 *  - soporte: correo de soporte
 */
export default function FooterEncargado({
  correo,
  manualHref = '#',
  soporte = 'sistemas@ulima.edu.pe',
}) {
  const perfil = datosPerfil(obtenerEncargadoActual(correo))
  const sincronizacion = useUltimaSincronizacion()

  // Cada vez que se abre el panel se registra el uso de la página
  useEffect(() => {
    registrarSincronizacion()
  }, [])

  return (
    <footer className="fe">
      <strong className="fe-titulo">
        Almacén de Equipos · Panel del encargado · {perfil ? perfil.almacen : 'Sin almacén asignado'}
      </strong>

      <div className="fe-enlaces">
        <a href={manualHref}>Manual del encargado</a>
        <span>
          Soporte: <a href={`mailto:${soporte}`}>{soporte}</a>
        </span>
        <span>Última sincronización: {formatearFecha(sincronizacion)}</span>
      </div>
    </footer>
  )
}
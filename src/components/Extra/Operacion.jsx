import { useLocation, useNavigate } from 'react-router-dom'
import { contarUnidades } from '../../data/Inventario'
import { obtenerTodasLasSolicitudes } from '../../data/Solicitudes'
import { obtenerPrestamos } from '../../data/Identificacion'
import { obtenerCuentas } from '../../data/cuentas'
import { obtenerTodasLasReservas } from '../../data/Reservas'
import { hoyISO } from '../../data/fechas'
import { useActualizacion } from '../../data/Actualizacion'
import './Operacion.css'
const grupos = [
  ['Operación', [
    ['inventario', 'Inventario', '/encargado/inventario'],
    ['solicitudes', 'Solicitudes', '/encargado/aprobacion-entrega'],
    ['prestamos', 'Préstamos vigentes', '/encargado/prestamos-vigentes'],
    ['vencidos', 'Vencidos', '/encargado/prestamos-vigentes?vencidos=1'],
    ['devoluciones', 'Devoluciones', '/encargado/devoluciones']]],
  ['Complementarios', [
    ['reservas', 'Reservas', '/encargado/reservas'],
    ['espera', 'Lista de espera', '/encargado/lista-espera'],
    ['tablero', 'Tablero', '/encargado/metricas'],
    ['usuarios', 'Usuarios', '/encargado/usuarios']]]]
export default function Operacion({ activo = 'inventario' }) {
  useActualizacion()
  const navigate = useNavigate()
  const location = useLocation()
  const solicitudes = obtenerTodasLasSolicitudes()
  const prestamos = obtenerPrestamos().filter((p) => p.estado === 'Entregado')
  const conteos = {
    inventario: contarUnidades(), solicitudes: solicitudes.filter((s) => s.estado === 'Enviada').length,
    prestamos: prestamos.length, vencidos: prestamos.filter((p) => p.hasta < hoyISO()).length,
    devoluciones: null, reservas: obtenerTodasLasReservas().length,
    espera: solicitudes.filter((s) => s.estado === 'Enviada').length,
    usuarios: obtenerCuentas().filter((c) => c.rol === 'estudiante').length }
  const seleccionado = location.search.includes('vencidos=1') ? 'vencidos' : activo
  return <nav className="ope-menu" aria-label="Panel del encargado">
    {grupos.map(([nombre, enlaces]) => <section key={nombre}>
      <p className="ope-menu__grupo">{nombre}</p>
      <ul className="ope-menu__lista">{enlaces.map(([id, etiqueta, ruta]) => <li key={id}>
        <button type="button" className={`ope-menu__item ${seleccionado === id ? 'is-activo' : ''}`} aria-current={seleccionado === id ? 'page' : undefined} onClick={() => navigate(ruta)}>
          <span>{etiqueta}</span>
          {id !== 'tablero' && <span className={`ope-menu__cant ope-menu__cant--${id}`}>{conteos[id] ?? '—'}</span>}
        </button>
      </li>)}</ul>
    </section>)}
  </nav>
}

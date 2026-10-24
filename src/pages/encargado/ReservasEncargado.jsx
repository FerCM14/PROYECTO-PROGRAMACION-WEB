import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { obtenerTodasLasReservas, calcularEstados } from '../../data/Reservas'
import { obtenerProducto } from '../../data/Producto'
import { obtenerCuenta } from '../../data/cuentas'
import { useActualizacion } from '../../data/Actualizacion'
import './GestionUsuarion.css'
export default function ReservasEncargado() {
  useActualizacion()
  const reservas = obtenerTodasLasReservas(); const estados = calcularEstados(reservas)
  return <div className="gu-pagina"><HeaderEncargado /><div className="gu-cuerpo"><aside><Operacion activo="reservas" /></aside><main className="gu-main"><h1>Reservas de equipos</h1><p>{reservas.length} reservas registradas</p><div className="gu-tabla"><table><thead><tr>{['Reserva','Estudiante','Equipo','Desde','Hasta','Estado'].map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{reservas.map((r) => {const c = obtenerCuenta(r.correo);return <tr key={r.id}><td>{r.id}</td><td>{c ? `${c.nombres} ${c.apellidos}` : r.correo}</td><td>{obtenerProducto(r.productoId)?.nombre || r.productoId}</td><td>{r.desde}</td><td>{r.hasta}</td><td>{estados[r.id]?.estado}</td></tr>})}</tbody></table>{!reservas.length && <p>Sin reservas registradas.</p>}</div></main></div><FooterEncargado /></div>
}

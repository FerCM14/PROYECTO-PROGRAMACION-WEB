from pathlib import Path
p=Path('src/pages/encargado/Devoluciones.jsx');s=p.read_text(encoding='utf-8');s="import { registrarRetraso } from '../../data/retrasos'\nimport { registrarDeuda } from '../../data/deudas'\n"+s;p.write_text(s,encoding='utf-8')
p=Path('src/pages/estudiante/Reservas.jsx');s=p.read_text(encoding='utf-8');s="import { obtenerTodasLasReservas, cancelarReserva } from '../../data/Reservas'\n"+s;s=s.replace("const RUTA_CALENDARIO = '/calendario'","const RUTA_CALENDARIO = '/estudiante/calendario'").replace('`/equipo/${id}`','`/catalogo/${id}`').replace("const CLAVE_RESERVAS = 'calendario-reservas'",'');a=s.index('function leerReservas()');b=s.index('/* ---------- Estado',a);s=s[:a]+'''function leerReservas() {
  return obtenerTodasLasReservas().map((r) => ({ ...r, equipoId: r.productoId, inicio: r.desde, fin: r.hasta, tipo: 'Reservada' }))
}
function guardarReservas(lista) {
  const ids = new Set(lista.map((r) => r.id))
  obtenerTodasLasReservas().filter((r) => !ids.has(r.id)).forEach((r) => cancelarReserva(r.id))
}

'''+s[b:];s=s.replace('Number(a.id) - Number(b.id)','a.creadaEn - b.creadaEn').replace('Number(o.id) < Number(r.id)','o.creadaEn < r.creadaEn');p.write_text(s,encoding='utf-8')
p=Path('src/pages/estudiante/ReservaAnticipada.jsx');s=p.read_text(encoding='utf-8').replace("const ESTUDIANTE = { nombre: 'Renzo Mendoza', correo: 'rmendoza@aloe.ulima.edu.pe' }","const estudianteActual = () => obtenerSesion() || { correo: '' }");s="import { obtenerSesion } from '../../data/cuentas'\n"+s;s=s.replace('export default function ReservaAnticipada() {','export default function ReservaAnticipada() {\n  const ESTUDIANTE = estudianteActual()');p.write_text(s,encoding='utf-8')
# Supply a real reservations destination for the manager using the shared records.
p=Path('src/main.jsx');s=p.read_text(encoding='utf-8').replace("import RegistroEntrega from", "import ReservasEncargado from './pages/encargado/ReservasEncargado.jsx'\nimport RegistroEntrega from");s=s.replace("  { path: '/encargado/ranking'", "  { path: '/encargado/reservas', element: <ReservasEncargado /> },\n  { path: '/encargado/ranking'");p.write_text(s,encoding='utf-8')

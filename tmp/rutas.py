from pathlib import Path
# Catalog keeps all existing filters, cards and footer.
p=Path('src/pages/estudiante/Catalogo.jsx');s=p.read_text(encoding='utf-8').replace("{ Navigate, useNavigate }","{ useNavigate }").replace("import Error403 from '../comun/403'","import HeaderVisitante from '../../components/Header/Header-Visitante'")
a=s.index('  if (!cuenta) {');b=s.index('  const totalPaginas',a);s=s[:a]+"  const esEstudiante = cuenta?.rol === 'estudiante' && !cuenta.bloqueada\n\n"+s[b:];s=s.replace('<HeaderEstudiante />','{esEstudiante ? <HeaderEstudiante /> : <HeaderVisitante />}').replace('navigate(`/catalogo/${producto.id}`)','navigate(esEstudiante ? `/catalogo/${producto.id}` : `/visitante/cata/${producto.id}`)');p.write_text(s,encoding='utf-8')
# Use canonical inventory in the waiting list.
p=Path('src/pages/encargado/ListaEspera.jsx');s=p.read_text(encoding='utf-8');a=s.index('function leerProductos()');b=s.index('// Solicitudes en espera',a);s="import { obtenerInventario } from '../../data/Inventario'\n"+s[:a]+'const leerProductos = obtenerInventario\n\n'+s[b:];p.write_text(s,encoding='utf-8')
# Correct all legacy links while preserving presentation.
for p in Path('src').rglob('*.jsx'):
 s=p.read_text(encoding='utf-8').replace("'/encargado/solicitudes'","'/encargado/aprobacion-entrega'").replace("'/encargado/prestamos'","'/encargado/prestamos-vigentes'").replace("'/encargado/vencidos'","'/encargado/prestamos-vigentes?vencidos=1'").replace("'/estudiante/reserva-anticipada'","'/reserva-anticipada'")
 p.write_text(s,encoding='utf-8')
# Same reservation records in calendar and reservations page, retain legacy fields.
p=Path('src/pages/estudiante/Calendario.jsx');s=p.read_text(encoding='utf-8');s="import { obtenerTodasLasReservas, registrarReserva } from '../../data/Reservas'\n"+s;s=s.replace("const CLAVE_RESERVAS = 'calendario-reservas'\n",'');a=s.index('function leerReservas()');b=s.index('/* ---------- Cálculos',a);s=s[:a]+'''function leerReservas() {
  return obtenerTodasLasReservas().map((r) => ({ ...r, equipoId: r.productoId, inicio: r.desde, fin: r.hasta, tipo: 'Reservada' }))
}
function guardarReservas(lista) {
  const ids = new Set(obtenerTodasLasReservas().map((r) => r.id))
  lista.filter((r) => !ids.has(r.id)).forEach((r) => registrarReserva({ correo: r.correo, productoId: r.equipoId, desde: r.inicio, hasta: r.fin }))
}

'''+s[b:];s=s.replace('setReservas(lista)','setReservas(leerReservas())');s=s.replace("equipo: producto.nombre,\n        curso:","productoId: producto.id,\n        desde: rango.inicio, hasta: rango.fin,\n        equipo: producto.nombre,\n        curso:");p.write_text(s,encoding='utf-8')
# Correct history's canonical loan source already done.

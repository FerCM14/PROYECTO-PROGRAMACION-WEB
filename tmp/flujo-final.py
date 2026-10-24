from pathlib import Path
p=Path('src/pages/encargado/AprobacionEntrega.jsx');s=p.read_text(encoding='utf-8').replace('navigate(`/registro-entrega/${fila.s.prestamo}`)','navigate(`/encargado/registro-entrega?codigo=${encodeURIComponent(fila.s.prestamo)}`)');p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Inventario.jsx');s=p.read_text(encoding='utf-8');s="import { obtenerInventario } from '../../data/Inventario'\n"+s;s=s.replace('PRODUCTOS.map((p) => {','obtenerInventario().map((p) => {');p.write_text(s,encoding='utf-8')
# Compact panels leave the charts visible while retaining every row.
p=Path('src/pages/encargado/Ranking.css');s=p.read_text(encoding='utf-8')+'\n.rk-grid>.rk-panel:nth-child(-n+2){max-height:350px}.rk-grid{align-items:start}.rk-grid>.rk-panel:nth-child(n+3){min-height:260px}\n';p.write_text(s,encoding='utf-8')
p=Path('src/pages/estudiante/Calendario.jsx');s=p.read_text(encoding='utf-8');a=s.index('function guardarReservas(lista)');b=s.index('/* ---------- Cálculos',a);s=s[:a]+s[b:];a=s.index('    const nueva = {',s.index('  const confirmarReserva'));b=s.index('    setAviso(',a);s=s[:a]+'''    registrarReserva({ correo: cuenta.correo, productoId: producto.id, desde: modal.desde, hasta: modal.hasta })
    setReservas(leerReservas())

'''+s[b:];a=s.index('    const nueva = {',s.index('  const confirmarPrestamo'));b=s.index('    try {',a);s=s[:a]+s[b:];s=s.replace("estado: 'Aprobada'","estado: 'Enviada'");s=s.replace('`Rango ${textoRango} marcado como prestada. Lo verás en Mis solicitudes.`','`Solicitud enviada para ${fechaCorta(rango.inicio)} → ${fechaCorta(rango.fin)}. La verás en Mis solicitudes.`');p.write_text(s,encoding='utf-8')
# Migrate existing calendar reservations instead of hiding them.
p=Path('src/data/Reservas.js');s=p.read_text(encoding='utf-8');a=s.index('function leer()');b=s.index('function guardar(lista)',a);s=s[:a]+'''function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE))
    const lista = Array.isArray(datos) ? datos : []
    const antiguas = JSON.parse(localStorage.getItem('calendario-reservas') || '[]')
    const migradas = (Array.isArray(antiguas) ? antiguas : [])
      .filter((r) => r.tipo === 'Reservada' && !lista.some((actual) => actual.id === r.id))
      .map((r) => ({ id:r.id, correo:r.correo, productoId:r.equipoId, desde:r.inicio, hasta:r.fin, creadaEn:Number(r.id) || 0, cancelada:false }))
    if (migradas.length) localStorage.setItem(CLAVE, JSON.stringify([...lista, ...migradas]))
    return [...lista, ...migradas]
  } catch { return [] }
}

'''+s[b:];p.write_text(s,encoding='utf-8')

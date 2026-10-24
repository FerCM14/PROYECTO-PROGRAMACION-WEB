from pathlib import Path
p=Path('src/data/cuentas.js');s=p.read_text(encoding='utf-8');s="import { obtenerPrestamos } from './Identificacion'\nimport { obtenerEncargados } from './Encargadosstorage'\nimport { obtenerTodasLasReservas, cancelarReserva } from './Reservas'\n"+s;s=s.replace('export function bloquearCuenta(correo) {','''export function bloquearCuenta(correo, motivo = 'Bloqueo desde el historial', detalle = '') {
  if (obtenerPrestamos().some((p) => p.correo === normalizar(correo) && p.estado === 'Entregado')) {
    return { ok: false, motivo: 'prestamo-pendiente' }
  }
  if (!motivo.trim()) return { ok: false, motivo: 'motivo-requerido' }''');s=s.replace('cuentas[indice] = { ...cuentas[indice], bloqueada: true }','''const evento = { fecha: new Date().toISOString(), accion: 'Cuenta bloqueada', motivo, detalle }
  cuentas[indice] = { ...cuentas[indice], bloqueada: true, historial: [...(cuentas[indice].historial || []), evento], notificaciones: [...(cuentas[indice].notificaciones || []), evento] }
  obtenerTodasLasReservas().filter((r) => r.correo === buscado && r.hasta >= new Date().toISOString().slice(0, 10)).forEach((r) => cancelarReserva(r.id))''');s=s.replace('bloqueada: false }','bloqueada: false, deuda: null }');s=s.replace('const cuenta = obtenerCuentas().find(\n    (c) => c.correo === buscado && c.contrasena === contrasena\n  )',"const cuenta = [...obtenerCuentas(), ...obtenerEncargados().map((e) => ({ ...e, rol: 'encargado' }))].find(\n    (c) => c.correo === buscado && c.contrasena === contrasena\n  )");s=s.replace('correo: cuenta.correo,\n      nombres:',"correo: cuenta.correo,\n      rol: cuenta.rol, almacen: cuenta.almacen || '',\n      nombres:");p.write_text(s,encoding='utf-8')
p=Path('src/pages/visitante/LoginPage.jsx');s=p.read_text(encoding='utf-8').replace("navigate('/cuenta')","navigate(respuesta.cuenta.rol === 'encargado' ? '/encargado/inventario' : '/cuenta')");s=s.replace('<h1>Inicia sesión</h1>', '<h1>Inicia sesión</h1>\n          <button type="button" onClick={() => navigate(\'/registroencargado\')}>Registrar encargado</button>');p.write_text(s,encoding='utf-8')
p=Path('src/data/Panelencargado.js');s=p.read_text(encoding='utf-8').replace('const lista = obtenerEncargados()',"const lista = obtenerEncargados()\n  correo = correo || JSON.parse(localStorage.getItem('sesionActual') || 'null')?.correo");p.write_text(s,encoding='utf-8')
p=Path('src/data/Producto.js');s=p.read_text(encoding='utf-8');a=s.index('export function cambiarEstadoUnidad');s=s[:a]+'''export function cambiarEstadoUnidad(codigoUnidad, estado) {
  const encontrada = PRODUCTOS.some((p) => obtenerProducto(p.id).unidades.some((u) => u.codigo === codigoUnidad))
  if (!encontrada) return { ok: false }
  const cambios = leerJSON('inventario-estados', {})
  cambios[codigoUnidad] = { ...cambios[codigoUnidad], estado }
  return { ok: guardarJSON('inventario-estados', cambios) }
}
''';p.write_text(s,encoding='utf-8')

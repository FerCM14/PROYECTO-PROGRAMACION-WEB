from pathlib import Path
p=Path('src/pages/encargado/CondicionPrestamo.jsx');s=p.read_text(encoding='utf-8').replace("{ useNavigate }", "{ useNavigate, useSearchParams }");s=s.replace("import { obtenerTodasLasSolicitudes }", "import { PRODUCTOS, obtenerProducto, obtenerCategoria, registrarUnidadProducto, cambiarEstadoUnidad } from '../../data/Producto'\nimport { obtenerPrestamos } from '../../data/Identificacion'\nimport { useActualizacion } from '../../data/Actualizacion'\nimport { obtenerTodasLasSolicitudes }");a=s.index('const EQUIPO =');b=s.index('const UBICACIONES',a);s=s[:a]+s[b:];a=s.index('const UNIDADES_INICIALES');b=s.index('const FORMATO_CODIGO',a);s=s[:a]+s[b:];a=s.index('export default function CondicionPrestamo()');b=s.index('  useEffect(() => {\n    if (!mensaje)',a);s=s[:a]+'''export default function CondicionPrestamo() {
  const [params] = useSearchParams()
  const id = params.get('id') || PRODUCTOS[0]?.id
  const producto = obtenerProducto(id)
  if (!producto) return <div className="cp-pagina"><HeaderEncargado /><main className="cp-main"><h1>Equipo no encontrado</h1></main><FooterEncargado /></div>
  return <CondicionEquipo key={producto.id} producto={producto} />
}

function CondicionEquipo({ producto }) {
  useActualizacion()
  const navigate = useNavigate()
  const EQUIPO = { ...producto, categoria: obtenerCategoria(producto.categoria)?.nombre || producto.categoria }
  const CLAVE_CONDICIONES = `condiciones-${producto.id}`
  const [guardadas, setGuardadas] = useState(() => leer(CLAVE_CONDICIONES, { dias:producto.duracionMax, requiereAutorizacion:producto.autorizacion, admiteRenovacion:producto.renovable, penalizacion:producto.penalizacion ?? 15 }))
  const [condiciones, setCondiciones] = useState(guardadas)
  const unidades = obtenerProducto(producto.id).unidades.map((u) => ({...u, ubicacion:u.ubicacion || 'Almacén H-102', observaciones:u.observaciones || u.nota || ''}))
  const solicitudes = obtenerTodasLasSolicitudes()
  const [pestana, setPestana] = useState('unidades')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [baja, setBaja] = useState(null)
  const [motivoBaja, setMotivoBaja] = useState('')
  const [mensaje, setMensaje] = useState('')

'''+s[b:];s=s.replace("const dias = Math.min(30, Math.max(1, Number(condiciones.dias) || 1))", "const dias = condiciones.dias === '' || condiciones.dias === null ? null : Math.min(30, Math.max(1, Number(condiciones.dias) || 1))");a=s.index('    setUnidades((previo)');b=s.index('  const textoRenovacion',a);s=s[:a]+'''    const resultado = registrarUnidadProducto(producto.id, { codigo, ubicacion })
    if (!resultado.ok) { setMensaje('No se pudo registrar: el código ya existe.'); return }
    setModalAbierto(false)
    setMensaje(`Unidad ${codigo} registrada`)
  }

  function confirmarBaja(e) {
    e.preventDefault()
    if (obtenerPrestamos().some((p) => p.unidad === baja.codigo && p.estado !== 'Devuelto')) { setMensaje('No se puede dar de baja una unidad con un préstamo pendiente.'); setBaja(null); return }
    cambiarEstadoUnidad(baja.codigo, 'De baja', motivoBaja.trim())
    setBaja(null)
    setMensaje('Unidad dada de baja. Se registró el motivo en el inventario.')
  }

'''+s[b:];s=s.replace('activo="Inventario"','activo="inventario"').replace("navigate('/encargado/editar-equipo')", "navigate(`/encargado/editar-equipo?id=${producto.id}`)");s=s.replace('<p>\n                {EQUIPO.marca}', '<p>\n                {EQUIPO.marca}');s=s.replace('            </div>\n            <div className="cp-equipo-acciones">','''              <p>{producto.descripcion}</p>
              <p>Accesorios: {producto.accesorios.join(', ') || 'Sin accesorios registrados'}</p>
            </div>
            <div className="cp-equipo-acciones">''',1);s=s.replace('<TablaUnidades unidades={unidades} prestamos={prestamoPorUnidad} />','<TablaUnidades unidades={unidades} prestamos={prestamoPorUnidad} onBaja={(u) => { setBaja(u); setMotivoBaja(\'\') }} />');s=s.replace('value={condiciones.dias}','value={condiciones.dias ?? \'\'} placeholder="Sin límite"');s=s.replace('      {modalAbierto && (','''      {baja && <div className="cp-overlay"><form className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-baja-titulo" onSubmit={confirmarBaja}><h2 id="cp-baja-titulo">Dar de baja unidad</h2><p>{producto.nombre} · Modelo {producto.modelo} · {baja.codigo}</p><label className="cp-modal-campo">Motivo de baja<textarea autoFocus required className="cp-input" value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} /></label><div className="cp-modal-acciones"><button type="button" className="cp-btn cp-btn-secundario" onClick={() => setBaja(null)}>Cancelar</button><button type="submit" className="cp-btn cp-btn-peligro" disabled={!motivoBaja.trim()}>Dar de baja</button></div></form></div>}
      {modalAbierto && (''');s=s.replace('function TablaUnidades({ unidades, prestamos })', 'function TablaUnidades({ unidades, prestamos, onBaja })');s=s.replace('<th>Préstamo vigente</th>', '<th>Préstamo vigente</th><th>Acción</th>');s=s.replace("<td className=\"cp-codigo\">{prestamos[u.codigo] || '—'}</td>","<td className=\"cp-codigo\">{prestamos[u.codigo] || '—'}</td><td><button type=\"button\" className=\"cp-btn cp-btn-secundario\" disabled={u.estado === 'De baja'} onClick={() => onBaja(u)}>Dar de baja</button></td>");p.write_text(s,encoding='utf-8')
# React compiler memo dependencies are unnecessary for these small live storage reads.
s=p.read_text(encoding='utf-8').replace('useEffect, useMemo, useRef','useEffect, useRef');a=s.index('  const pendientes = useMemo(');b=s.index('  const hayCambios',a);s=s[:a]+'''  const pendientes = solicitudes.filter((s) => s.estado === 'Enviada').length
  const prestamoPorUnidad = Object.fromEntries(obtenerPrestamos().filter((p) => p.estado === 'Entregado').map((p) => [p.unidad,p.codigo]))
  const historial = solicitudes.filter((s) => unidades.some((u) => u.codigo === s.unidad))

'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('src/data/Producto.js');s=p.read_text(encoding='utf-8');s=s.replace("  return {\n    ...producto,\n    titulo:","  const condiciones = leerJSON(`condiciones-${producto.id}`, {})\n  const unidades = [...generarUnidades(producto, detalle), ...(leerJSON('producto-unidades', {})[producto.id] || [])].map((u) => ({ ...u, ...(leerJSON('inventario-estados', {})[u.codigo] || {}) }))\n  return {\n    ...producto,\n    total: unidades.length,\n    duracionMax: condiciones.dias !== undefined ? condiciones.dias : producto.duracionMax,\n    penalizacion: condiciones.penalizacion ?? 15,\n    titulo:");s=s.replace('autorizacion: Boolean(detalle.autorizacion)','autorizacion: condiciones.requiereAutorizacion ?? Boolean(detalle.autorizacion)').replace('renovable: Boolean(detalle.renovable)','renovable: condiciones.admiteRenovacion ?? Boolean(detalle.renovable)');s=s.replace("unidades: generarUnidades(producto, detalle).map((u) => ({ ...u, ...(leerJSON('inventario-estados', {})[u.codigo] || {}) }))",'unidades');s=s.replace('export function cambiarEstadoUnidad(codigoUnidad, estado)',"export function cambiarEstadoUnidad(codigoUnidad, estado, motivo = '')").replace('...cambios[codigoUnidad], estado }',"...cambios[codigoUnidad], estado, ...(motivo ? { nota: motivo, motivoBaja: motivo } : {}) }");s+='''
export function registrarUnidadProducto(id, unidad) {
  if (!obtenerProducto(id) || PRODUCTOS.some((p) => obtenerProducto(p.id).unidades.some((u) => u.codigo === unidad.codigo))) return {ok:false}
  const todas = leerJSON('producto-unidades', {})
  todas[id] = [...(todas[id] || []), { ...unidad, estado:'Disponible' }]
  return {ok:guardarJSON('producto-unidades', todas)}
}
''';p.write_text(s,encoding='utf-8')

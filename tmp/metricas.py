from pathlib import Path
# Shared metrics period lives in the metrics data module.
p=Path('src/data/Ranking.js');s=p.read_text(encoding='utf-8');a=s.index('export function periodoInicial()');b=s.index('export function calcularRanking',a);periodo=s[a:b];s=s[:a]+s[b:];p.write_text(s,encoding='utf-8')
p=Path('src/data/Metricas.js');s=p.read_text(encoding='utf-8')+'\n'+periodo;p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Ranking.jsx');s=p.read_text(encoding='utf-8').replace("import { calcularRanking, periodoInicial } from '../../data/Ranking'","import { calcularRanking } from '../../data/Ranking'\nimport { periodoInicial } from '../../data/Metricas'");p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Metricas.jsx');s=p.read_text(encoding='utf-8').replace("import { useMemo, useState }", "import { useEffect, useMemo, useState }").replace("{ useNavigate }","{ Link, useNavigate }");s="import { useActualizacion } from '../../data/Actualizacion'\n"+s;s=s.replace('  const navigate = useNavigate()', '  const version = useActualizacion()\n  const navigate = useNavigate()');s=s.replace('[rangoValido, desde, hasta, almacen]','[rangoValido, desde, hasta, almacen, version]');s=s.replace("  const [mensaje, setMensaje] = useState('')","  const [mensaje, setMensaje] = useState('')\n  useEffect(() => { localStorage.setItem('metricas-periodo', JSON.stringify({desde,hasta})) }, [desde,hasta])");s=s.replace('<div className="mt-controles">','<div className="mt-controles">\n              <Link to="/encargado/ranking">Ranking de equipos</Link>');p.write_text(s,encoding='utf-8')
# refresh open lists when storage changes
for name,old,new in [('ListaEspera','const colas = useMemo(armarColas, [])','const version = useActualizacion()\n  const colas = useMemo(armarColas, [version])'),('PrestamosVigentes','const { vencidos, hoy, enCurso, total } = useMemo(clasificar, [])','const version = useActualizacion()\n  const { vencidos, hoy, enCurso, total } = useMemo(clasificar, [version])')]:
 p=Path(f'src/pages/encargado/{name}.jsx');s=p.read_text(encoding='utf-8');s="import { useActualizacion } from '../../data/Actualizacion'\n"+s.replace(old,new);p.write_text(s,encoding='utf-8')
# History must honor blocking result and display stored reasons.
p=Path('src/pages/encargado/Historial.jsx');s=p.read_text(encoding='utf-8').replace('    bloquearCuenta(correo)','''    const resultado = bloquearCuenta(correo)
    if (!resultado.ok) { recargar('No pudimos bloquear la cuenta: la estudiante tiene un préstamo entregado sin devolver. Registra primero la devolución.'); return }''');s=s.replace('<h1 className="hs-titulo">{nombre}</h1>', '''<h1 className="hs-titulo">{nombre}</h1>
              {datos.cuenta.historial?.map((evento, i) => <p key={i}>{evento.accion}: {evento.motivo} · {evento.detalle} · {evento.fecha}</p>)}''');p.write_text(s,encoding='utf-8')
# last request lookup is reusable from the request module
p=Path('src/data/Solicitudes.js');s=p.read_text(encoding='utf-8')+'''
export function ultimaSolicitudProducto(producto) {
  return leerTodas().filter((s) => Number(s.productoId) === producto.id || s.equipo === producto.nombre || producto.unidades?.some((u) => u.codigo === s.unidad))
    .sort((a,b) => String(b.fecha || b.desde || b.inicio || '').localeCompare(String(a.fecha || a.desde || a.inicio || '')))[0] || null
}
''';p.write_text(s,encoding='utf-8')
p=Path('src/data/Ranking.js');s=p.read_text(encoding='utf-8').replace('{ obtenerTodasLasSolicitudes }','{ obtenerTodasLasSolicitudes, ultimaSolicitudProducto }').replace("const ultima = todas.filter((s) => coincide(s,p)).map(fecha).filter(Boolean).sort().at(-1)","const ultimaSolicitud = ultimaSolicitudProducto(p)\n    const ultima = ultimaSolicitud ? fecha(ultimaSolicitud) : ''");p.write_text(s,encoding='utf-8')

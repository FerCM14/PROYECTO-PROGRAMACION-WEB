from pathlib import Path
p=Path('src/App.jsx');s=p.read_text(encoding='utf-8').replace("from 'components/","from './components/").replace("from 'data/","from './data/");p.write_text(s,encoding='utf-8')
p=Path('src/pages/visitante/LoginPage.jsx');s=p.read_text(encoding='utf-8');s=s.replace("onClick={() => navigate(respuesta.cuenta.rol === 'encargado' ? '/encargado/inventario' : '/cuenta')}","onClick={() => navigate('/cuenta')}");p.write_text(s,encoding='utf-8')
for name,old,new in [('ListaEspera','const version = useActualizacion()','useActualizacion()'),('PrestamosVigentes','const version = useActualizacion()','useActualizacion()')]:
 p=Path(f'src/pages/encargado/{name}.jsx');s=p.read_text(encoding='utf-8').replace("import { useMemo } from 'react'\n",'').replace(old,new).replace('useMemo(armarColas, [version])','armarColas()').replace('useMemo(clasificar, [version])','clasificar()');p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Metricas.jsx');s=p.read_text(encoding='utf-8').replace('const version = useActualizacion()','useActualizacion()').replace('useMemo(periodoInicial, [])','useMemo(() => periodoInicial(), [])').replace('useMemo(almacenActual, [])','useMemo(() => almacenActual(), [])');a=s.index('  const m = useMemo(');b=s.index('  const exportar',a);s=s[:a]+'  const m = rangoValido ? calcularMetricas({ desde, hasta, almacen }) : null\n\n'+s[b:];p.write_text(s,encoding='utf-8')
# Existing sessions of blocked accounts become invalid as well.
p=Path('src/data/cuentas.js');s=p.read_text(encoding='utf-8').replace("    return JSON.parse(localStorage.getItem(CLAVE_SESION))","    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION))\n    if (sesion && obtenerCuenta(sesion.correo)?.bloqueada) return null\n    return sesion");p.write_text(s,encoding='utf-8')
# Unified loan state changes also update the inventory used by metrics.
p=Path('src/data/Identificacion.js');s=p.read_text(encoding='utf-8');s="import { cambiarEstadoUnidad } from './Producto'\n"+s;s=s.replace('  guardar(todos)\n\n  try {','  guardar(todos)\n  cambiarEstadoUnidad(prestamo.unidad, prestamo.estado === \'Entregado\' ? \'Prestada\' : \'Disponible\')\n\n  try {');p.write_text(s,encoding='utf-8')
# Restore files touched only by newline normalization.
backup=Path('tmp/antes-conexiones')
for old in backup.rglob('*'):
 if old.is_file():
  p=Path('src')/old.relative_to(backup)
  if p.exists() and p.read_text(encoding='utf-8-sig') == old.read_text(encoding='utf-8-sig'): p.write_bytes(old.read_bytes())

from pathlib import Path
# Normalize request fields once at the data boundary for all existing callers.
p=Path('src/data/Solicitudes.js');s=p.read_text(encoding='utf-8').replace('    ...datos\n  }','''    ...datos,
    productoId: datos.productoId ?? datos.equipoId ?? null,
    desde: datos.desde || datos.inicio || datos.fechaInicio || '',
    hasta: datos.hasta || datos.devolucion || datos.fechaDevolucion || ''
  }''');p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/AprobacionEntrega.jsx');s=p.read_text(encoding='utf-8').replace("['fechaFin', 'hasta', 'fin', 'fechaDevolucion']","['fechaFin', 'hasta', 'fin', 'fechaDevolucion', 'devolucion']");p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/ListaEspera.jsx');s=p.read_text(encoding='utf-8').replace('solicitud.productoId ?? null','solicitud.productoId ?? solicitud.equipoId ?? null').replace("solicitud.fechaEntrega || ''","solicitud.fechaEntrega || solicitud.inicio || ''").replace("solicitud.fechaFin || ''","solicitud.fechaFin || solicitud.devolucion || ''");p.write_text(s,encoding='utf-8')
p=Path('src/pages/estudiante/FormularioSolicitud.jsx');s=p.read_text(encoding='utf-8').replace("navigate('/solicitudes')","navigate('/estudiante/mis-solicitudes')");p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/RegistroEntrega.jsx');s=p.read_text(encoding='utf-8').replace("new URLSearchParams(window.location.search).get('codigo') ||", "new URLSearchParams(window.location.search).get('codigo') ||\n    new URLSearchParams(window.location.search).get('prestamo') ||");p.write_text(s,encoding='utf-8')
# Make all consumers see the saved unit states, including approval and calendar.
p=Path('src/data/Producto.js');s=p.read_text(encoding='utf-8').replace('unidades: generarUnidades(producto, detalle)','unidades: generarUnidades(producto, detalle).map((u) => ({ ...u, ...(leerJSON(\'inventario-estados\', {})[u.codigo] || {}) }))');p.write_text(s,encoding='utf-8')
# No synthetic totals for reservations in a new browser. Existing records remain intact.
p=Path('src/data/Reservas.js');s=p.read_text(encoding='utf-8');a=s.index('function sumarDias(dias)');b=s.index('/* ---------- Lectura',a);s=s[:a]+s[b:];s=s.replace('const iniciales = crearIniciales()','const iniciales = []').replace('Array.isArray(datos) ? datos : crearIniciales()','Array.isArray(datos) ? datos : []').replace('return crearIniciales()','return []');p.write_text(s,encoding='utf-8')
# Only restore text files whose content really did not change.
backup=Path('tmp/antes-conexiones')
for old in backup.rglob('*'):
 if old.suffix in ('.js','.jsx','.css','.svg'):
  p=Path('src')/old.relative_to(backup)
  if p.exists() and p.read_text(encoding='utf-8-sig') == old.read_text(encoding='utf-8-sig'): p.write_bytes(old.read_bytes())

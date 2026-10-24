from pathlib import Path
p=Path('src/data/Metricas.js');s=p.read_text(encoding='utf-8').replace("from './prestamos'","from './Identificacion'");a=s.index('function leerProductos()');b=s.index('export function almacenActual',a);s="import { obtenerInventario } from './Inventario'\n"+s[:a]+'const leerProductos = obtenerInventario\n\n'+s[b:];p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Historial.jsx');s=p.read_text(encoding='utf-8').replace("from '../../data/prestamos'","from '../../data/Identificacion'");p.write_text(s,encoding='utf-8')

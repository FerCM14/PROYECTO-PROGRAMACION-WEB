from pathlib import Path
import shutil,re
root=Path('src'); backup=Path('tmp/antes-conexiones'); shutil.copytree(root,backup,dirs_exist_ok=True)
# Resolve imports with the exact on-disk casing everywhere.
for p in root.rglob('*'):
 if p.suffix not in ('.js','.jsx'): continue
 s=p.read_text(encoding='utf-8')
 def fix(m):
  rel=m.group(2); target=p.parent/rel
  if not rel.startswith('.'): return m.group(0)
  parent=target.parent
  if parent.exists():
   for f in parent.iterdir():
    if f.stem.lower()==target.name.lower() and f.suffix in ('.js','.jsx'):
     return m.group(1)+str(Path(rel).parent).replace('\\','/')+'/'+f.stem+m.group(3) if '/' in rel else m.group(1)+'./'+f.stem+m.group(3)
  return m.group(0)
 s=re.sub(r"(from\s+['\"])([^'\"]+)(['\"])",fix,s)
 p.write_text(s,encoding='utf-8')
p=Path('src/data/Metricas.js'); s=p.read_text().replace("from './prestamos'","from './Identificacion'")
a=s.index('function leerProductos()'); b=s.index('// Almacén',a)
s=s[:a]+"const leerProductos = obtenerInventario\n\n"+s[b:]
s="import { obtenerInventario } from './Inventario'\n"+s
p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Historial.jsx'); s=p.read_text().replace("from '../../data/prestamos'","from '../../data/Identificacion'");p.write_text(s,encoding='utf-8')

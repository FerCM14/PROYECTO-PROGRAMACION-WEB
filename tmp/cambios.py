from pathlib import Path
b=Path('tmp/antes-conexiones')
for p in Path('src').rglob('*'):
 if p.is_file():
  old=b/p.relative_to('src')
  if not old.exists() or p.read_bytes()!=old.read_bytes(): print(p)

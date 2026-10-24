from pathlib import Path
p=Path('src/pages/encargado/Devoluciones.jsx');s=p.read_text(encoding='utf-8').replace("mostrarPanel && derivar ? 'En mantenimiento' : 'Disponible'","mostrarPanel && derivar ? 'Mantenimiento' : 'Disponible'");p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Ranking.jsx');s=p.read_text(encoding='utf-8').replace('obtenerPeriodoMetricas, guardarPeriodoMetricas }','obtenerPeriodoMetricas, guardarPeriodoMetricas, MESES }').replace('<span>{m.mes}</span>',"<span>{MESES[Number(m.mes.slice(5))-1]} {m.mes.slice(0,4)}</span>");p.write_text(s,encoding='utf-8')

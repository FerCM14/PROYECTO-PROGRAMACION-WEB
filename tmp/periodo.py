from pathlib import Path
p=Path('src/data/Metricas.js');s=p.read_text(encoding='utf-8')+'''
export function obtenerPeriodoMetricas() {
  try {
    const periodo = JSON.parse(localStorage.getItem('metricas-periodo'))
    if (periodo?.desde && periodo?.hasta && periodo.desde <= periodo.hasta) return periodo
  } catch { /* usar periodo inicial */ }
  return periodoInicial()
}
export function guardarPeriodoMetricas(periodo) {
  if (periodo.desde && periodo.hasta && periodo.desde <= periodo.hasta) localStorage.setItem('metricas-periodo', JSON.stringify(periodo))
}
''';p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Metricas.jsx');s=p.read_text(encoding='utf-8').replace('calcularMetricas, exportarCSV }','calcularMetricas, exportarCSV, obtenerPeriodoMetricas, guardarPeriodoMetricas }');a=s.index('// Por defecto:');b=s.index('function soles',a);s=s[:a]+s[b:];s=s.replace('useMemo(() => periodoInicial(), [])','useMemo(() => obtenerPeriodoMetricas(), [])').replace("localStorage.setItem('metricas-periodo', JSON.stringify({desde,hasta}))",'guardarPeriodoMetricas({desde,hasta})');p.write_text(s,encoding='utf-8')
p=Path('src/pages/encargado/Ranking.jsx');s=p.read_text(encoding='utf-8').replace("import { useState }", "import { useEffect, useState }").replace('{ periodoInicial }','{ obtenerPeriodoMetricas, guardarPeriodoMetricas }');a=s.index('  const [periodo,setPeriodo]');b=s.index('  const [categoria',a);s=s[:a]+'''  const [periodo,setPeriodo] = useState(obtenerPeriodoMetricas)
  useEffect(() => { guardarPeriodoMetricas(periodo) }, [periodo])
'''+s[b:];p.write_text(s,encoding='utf-8')

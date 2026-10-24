import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { CATEGORIAS } from '../../data/Producto'
import { calcularRanking } from '../../data/Ranking'
import { obtenerPeriodoMetricas, guardarPeriodoMetricas, MESES } from '../../data/Metricas'
import { formatearFecha } from '../../data/fechas'
import { useActualizacion } from '../../data/Actualizacion'
import './Ranking.css'
const colores = ['#d9a600','#3974ad','#195662','#73a880','#9765aa','#df8650']
export default function Ranking() {
  useActualizacion()
  const [periodo,setPeriodo] = useState(obtenerPeriodoMetricas)
  useEffect(() => { guardarPeriodoMetricas(periodo) }, [periodo])
  const [categoria,setCategoria] = useState('')
  const valido = periodo.desde && periodo.hasta && periodo.desde <= periodo.hasta
  const r = calcularRanking({ ...periodo, categoria })
  const max = Math.max(1,...r.meses.map((m) => m.valores.reduce((s,v) => s+v.total,0)))
  return <div className="rk-pagina"><HeaderEncargado /><div className="rk-cuerpo"><aside><Operacion activo="tablero" /></aside><main className="rk-main">
    <div className="rk-cabecera"><div><h1>Ranking de equipos</h1><p>Periodo del {formatearFecha(periodo.desde)} al {formatearFecha(periodo.hasta)}</p></div><Link to="/encargado/metricas">Métricas</Link><label>Desde <input type="date" value={periodo.desde} onChange={(e) => setPeriodo({...periodo,desde:e.target.value})} /></label><label>Hasta <input type="date" value={periodo.hasta} onChange={(e) => setPeriodo({...periodo,hasta:e.target.value})} /></label><select aria-label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}><option value="">Categoría: todas</option>{CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
    {!valido ? <p role="alert">Elige un periodo válido.</p> : <div className="rk-grid">
      <section className="rk-panel"><h2>Más solicitados</h2><table><thead><tr><th>#</th><th>Equipo</th><th>Préstamos</th><th>Uso %</th></tr></thead><tbody>{r.mas.map((p) => <tr key={p.id}><td>{p.codigo}</td><td>{p.nombre}</td><td>{p.prestamos}</td><td>{p.porcentaje.toFixed(1)} %</td></tr>)}</tbody></table>{!r.mas.length && <p>Sin solicitudes en el periodo.</p>}</section>
      <section className="rk-panel"><h2>Sin movimiento</h2><table><thead><tr><th>Equipo</th><th>Unidades</th><th>Último préstamo</th></tr></thead><tbody>{r.sin.map((p) => <tr key={p.id}><td>{p.nombre}</td><td>{p.unidades.length}</td><td>{p.ultima ? formatearFecha(p.ultima) : 'Sin registro'}</td></tr>)}</tbody></table>{!r.sin.length && <p>Todos los equipos tienen movimiento.</p>}</section>
      <section className="rk-panel"><h2>Préstamos por carrera</h2>{r.carreras.map((c) => <div className="rk-carrera" key={c.carrera}><span>{c.carrera}</span><div className="rk-pista"><div style={{width:`${c.porcentaje}%`}} /></div><span>{c.porcentaje.toFixed(1)} % ({c.total})</span></div>)}{!r.carreras.length && <p>Sin cuentas registradas.</p>}</section>
      <section className="rk-panel"><h2>Préstamos por mes y categoría</h2><div className="rk-grafico">{r.meses.map((m) => <div className="rk-mes" key={m.mes}><div className="rk-columna">{m.valores.map((v) => <div key={v.categoria} title={`${v.categoria}: ${v.total}`} style={{height:`${v.total/max*160}px`,background:colores[CATEGORIAS.findIndex((c) => c.id === v.categoria)]}} />)}</div><span>{MESES[Number(m.mes.slice(5))-1]} {m.mes.slice(0,4)}</span></div>)}</div><div className="rk-leyenda">{CATEGORIAS.filter((c) => !categoria || c.id === categoria).map((c,i) => <span key={c.id}><i style={{background:colores[categoria ? CATEGORIAS.findIndex((x) => x.id === c.id) : i]}} />{c.nombre}</span>)}</div></section>
    </div>}
  </main></div><FooterEncargado /></div>
}

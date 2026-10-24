import { useState } from 'react'
import { Link } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { bloquearCuenta, desbloquearCuenta } from '../../data/cuentas'
import { usuariosConResumen } from '../../data/Ranking'
import { useActualizacion } from '../../data/Actualizacion'
import './GestionUsuarion.css'
export default function GestionUsuarion() {
  useActualizacion()
  const [,actualizar] = useState(0)
  const [busqueda,setBusqueda] = useState(''); const [carrera,setCarrera] = useState(''); const [estado,setEstado] = useState('')
  const [pagina,setPagina] = useState(1); const [modal,setModal] = useState(null)
  const [motivo,setMotivo] = useState('Penalidad sin regularizar'); const [detalle,setDetalle] = useState('')
  const [mensaje,setMensaje] = useState(null)
  const usuarios = usuariosConResumen()
  const filtrados = usuarios.filter((u) => (!carrera || u.carrera === carrera) && (!estado || u.estado === estado) && `${u.nombres} ${u.apellidos} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase()))
  const paginas = Math.max(1,Math.ceil(filtrados.length/9)); const actual = Math.min(pagina,paginas)
  function bloquear(e) {
    e.preventDefault()
    const resultado = bloquearCuenta(modal.correo,motivo,detalle)
    if (!resultado.ok) { setMensaje({error:true,texto:resultado.motivo === 'prestamo-pendiente' ? 'No pudimos bloquear la cuenta: la estudiante tiene un préstamo entregado sin devolver. Registra primero la devolución.' : 'No se pudo bloquear la cuenta.'}); setModal(null); return }
    setMensaje({texto:'Cuenta bloqueada. Se notificó a la estudiante y se registró el motivo en su historial.'}); setModal(null); actualizar((v) => v+1)
  }
  function desbloquear(u) {
    const resultado = desbloquearCuenta(u.correo)
    setMensaje({error:!resultado.ok,texto:resultado.ok ? 'Cuenta desbloqueada. Estado: Habilitado.' : 'No se pudo desbloquear la cuenta.'}); actualizar((v) => v+1)
  }
  return <div className="gu-pagina"><HeaderEncargado /><div className="gu-cuerpo"><aside><Operacion activo="usuarios" /></aside><main className="gu-main"><h1>Gestión de usuarios</h1><p>{usuarios.length} estudiantes · {usuarios.filter((u) => u.estado === 'Con deuda').length} con deuda · {usuarios.filter((u) => u.bloqueada).length} bloqueados</p>
    <div className="gu-filtros"><select aria-label="Carrera" value={carrera} onChange={(e) => {setCarrera(e.target.value);setPagina(1)}}><option value="">Carrera: todas</option>{[...new Set(usuarios.map((u) => u.carrera).filter(Boolean))].map((c) => <option key={c}>{c}</option>)}</select><select aria-label="Estado" value={estado} onChange={(e) => {setEstado(e.target.value);setPagina(1)}}><option value="">Estado: todos</option>{['Habilitado','Con deuda','Bloqueado'].map((e) => <option key={e}>{e}</option>)}</select><input aria-label="Buscar usuario" placeholder="Buscar por nombre, código o correo" value={busqueda} onChange={(e) => {setBusqueda(e.target.value);setPagina(1)}} /></div>
    {mensaje && <p role={mensaje.error ? 'alert' : 'status'} className={`gu-aviso ${mensaje.error ? 'gu-error' : ''}`}>{mensaje.texto}</p>}
    <div className="gu-tabla"><table><thead><tr>{['Usuario','Carrera','Préstamos','Retrasos','Deuda','Estado','Acción'].map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{filtrados.slice((actual-1)*9,actual*9).map((u) => <tr key={u.correo} className={u.estado === 'Habilitado' ? '' : 'gu-observado'}><td><strong>{u.nombres} {u.apellidos}</strong><small>{u.codigo}</small></td><td>{u.carrera}</td><td>{u.prestamos}</td><td>{u.retrasos}</td><td>{u.estado === 'Habilitado' ? '—' : `S/ ${u.monto.toFixed(2)}`}</td><td><button type="button" className={`gu-estado gu-estado--${u.bloqueada ? 'bloqueado' : u.estado === 'Con deuda' ? 'deuda' : 'habilitado'}`} onClick={() => setEstado(u.estado)}>{u.estado}</button></td><td><div className="gu-acciones"><button type="button" onClick={() => {setModal(u);setDetalle('');setMotivo('Penalidad sin regularizar')}} disabled={u.bloqueada}>Bloquear cuenta</button><button type="button" onClick={() => desbloquear(u)} disabled={u.estado === 'Habilitado'}>Desbloquear</button><Link to={`/encargado/historial?correo=${encodeURIComponent(u.correo)}`}>Ver historial</Link></div></td></tr>)}</tbody></table>{!filtrados.length && <p>No hay usuarios que coincidan.</p>}<div className="gu-paginacion"><span>{filtrados.length ? `Mostrando ${(actual-1)*9+1} a ${Math.min(actual*9,filtrados.length)} de ${filtrados.length} usuarios` : '0 usuarios'}</span><button type="button" disabled={actual <= 1} onClick={() => setPagina(actual-1)}>Anterior</button><span>{actual} / {paginas}</span><button type="button" disabled={actual >= paginas} onClick={() => setPagina(actual+1)}>Siguiente</button></div></div>
    {modal && <div className="gu-fondo" onKeyDown={(e) => e.key === 'Escape' && setModal(null)}><form className="gu-modal" role="dialog" aria-modal="true" aria-labelledby="gu-titulo" onSubmit={bloquear}><h2 id="gu-titulo">Bloquear cuenta</h2><p>{modal.nombres} {modal.apellidos} · {modal.codigo}</p><label>Motivo *<select autoFocus required value={motivo} onChange={(e) => setMotivo(e.target.value)}><option>Penalidad sin regularizar</option><option>Incumplimiento de las normas</option><option>Otro motivo</option></select></label><label>Detalle<textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} /></label><p className="gu-aviso gu-error">Al bloquear, la estudiante no podrá iniciar sesión, solicitar ni reservar equipos. Sus reservas activas quedarán canceladas.</p><div className="gu-acciones"><button type="button" onClick={() => setModal(null)}>Cancelar</button><button className="gu-bloquear" type="submit">Bloquear cuenta</button></div></form></div>}
  </main></div><FooterEncargado /></div>
}

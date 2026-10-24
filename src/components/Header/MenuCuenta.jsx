import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../../data/cuentas'
import './MenuCuenta.css'

export default function MenuCuenta({ iniciales, cuenta, onVerCuenta }) {
  const navigate = useNavigate()
  const [abierta, setAbierta] = useState(false)

  function seleccionar(evento) {
    const opcion = evento.target.value
    evento.target.value = ''
    if (opcion === 'cuenta') {
      if (onVerCuenta) onVerCuenta()
      else if (cuenta) setAbierta(true)
      else navigate('/cuenta')
    }
    if (opcion === 'salir') {
      cerrarSesion()
      navigate('/login', { replace: true })
    }
  }

  return <>
    <div className="menu-cuenta-control">
      <span className="menu-cuenta-avatar" aria-hidden="true">{iniciales || 'U'}</span>
      <select className="menu-cuenta-select" aria-label="Opciones de cuenta" defaultValue="" onChange={seleccionar}>
      <option value="" disabled>Mi cuenta</option>
      <option value="cuenta">Ver cuenta</option>
      <option value="salir">Cerrar sesión</option>
      </select>
      <svg className="menu-cuenta-flecha" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
    {abierta && <div className="menu-cuenta-fondo" onClick={(e) => e.target === e.currentTarget && setAbierta(false)} onKeyDown={(e) => e.key === 'Escape' && setAbierta(false)}>
      <section className="menu-cuenta-dialogo" role="dialog" aria-modal="true" aria-labelledby="menu-cuenta-titulo">
        <h2 id="menu-cuenta-titulo">Mi cuenta de encargado</h2>
        {cuenta ? <dl>
          <dt>Nombre</dt><dd>{cuenta.nombres} {cuenta.apellidos}</dd>
          <dt>Correo</dt><dd>{cuenta.correo}</dd>
          <dt>Almacén</dt><dd>{cuenta.almacen || 'Sin almacén asignado'}</dd>
          <dt>Anexo</dt><dd>{cuenta.anexo || 'Sin registrar'}</dd>
        </dl> : <p>No hay una cuenta de encargado activa.</p>}
        <button type="button" autoFocus onClick={() => setAbierta(false)}>Cerrar</button>
      </section>
    </div>}
  </>
}

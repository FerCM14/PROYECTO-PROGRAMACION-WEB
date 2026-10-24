// src/pages/encargado/Historial.jsx
// Historial de un estudiante: datos de la cuenta, deudas, retrasos y préstamos.
// Ruta sugerida: /encargado/usuarios/:correo  (también acepta ?correo=...)
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { obtenerCuenta, asignarDeuda, bloquearCuenta, desbloquearCuenta } from '../../data/cuentas'
import { obtenerPrestamos } from '../../data/Identificacion'
import { obtenerDeudas, obtenerDeudasPendientes, totalDeuda, pagarDeuda } from '../../data/deudas'
import { contarRetrasos } from '../../data/retrasos'
import './Historial.css'

const MS_DIA = 1000 * 60 * 60 * 24

// Ajusta estas rutas a las de tu proyecto
const RUTAS = {
  inventario: '/encargado/inventario',
  solicitudes: '/encargado/aprobacion-entrega',
  prestamos: '/encargado/prestamos-vigentes',
  vencidos: '/encargado/prestamos-vigentes?vencidos=1',
  devoluciones: '/encargado/devoluciones',
  usuarios: '/encargado/usuarios'
}

function parsear(texto) {
  const [anio, mes, dia] = String(texto).split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function formatear(texto) {
  if (!texto) return '—'
  const [anio, mes, dia] = String(texto).slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

function soles(monto) {
  return `S/ ${Number(monto).toFixed(2)}`
}

// Días de retraso de un préstamo: devuelto -> lo guardado; vigente -> hoy - pactada
function diasRetrasoDe(p) {
  if (p.estado === 'Devuelto') return p.devolucion?.diasRetraso || 0
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return Math.max(0, Math.round((hoy - parsear(p.hasta)) / MS_DIA))
}

function cargar(correo) {
  const cuenta = obtenerCuenta(correo)
  if (!cuenta) return null

  const deudas = obtenerDeudas(correo)
  const pendientes = obtenerDeudasPendientes(correo)

  const filas = obtenerPrestamos()
    .filter((p) => p.correo === cuenta.correo && p.estado !== 'Pendiente de entrega')
    .sort((a, b) => String(b.desde).localeCompare(String(a.desde)))
    .map((p) => {
      const deDelPrestamo = deudas.filter((d) => d.codigo === p.codigo)
      return {
        codigo: p.codigo,
        equipo: p.equipo || 'Equipo',
        unidad: p.unidad,
        entrega: p.entrega?.fechaEntrega || p.desde,
        devolucion: p.hasta,
        dias: diasRetrasoDe(p),
        pendiente: deDelPrestamo.filter((d) => !d.pagada).reduce((s, d) => s + d.monto, 0),
        pagado: deDelPrestamo.filter((d) => d.pagada).reduce((s, d) => s + d.monto, 0),
        faltantes: p.devolucion?.accesoriosFaltantes?.length || 0
      }
    })

  const codigosPendientes = [...new Set(pendientes.map((d) => d.codigo))]

  return {
    cuenta,
    filas,
    total: totalDeuda(correo),
    retrasos: contarRetrasos(correo),
    pendientes,
    codigosPendientes,
    diasPendientes: pendientes.reduce((s, d) => s + d.dias, 0),
    faltantesPendientes: filas
      .filter((f) => codigosPendientes.includes(f.codigo))
      .reduce((s, f) => s + f.faltantes, 0)
  }
}

function Historial() {
  const navigate = useNavigate()
  const { correo: correoRuta } = useParams()
  const [params] = useSearchParams()
  const correo = decodeURIComponent(correoRuta || params.get('correo') || '')

  const [version, setVersion] = useState(0)
  const [mensaje, setMensaje] = useState('')

  // `version` fuerza a leer de nuevo los datos después de una acción
  const datos = version >= 0 && correo ? cargar(correo) : null

  const recargar = (texto) => {
    setMensaje(texto)
    setVersion((v) => v + 1)
  }

  const registrarPago = () => {
    if (!datos || datos.pendientes.length === 0) return
    if (!window.confirm(`¿Registrar el pago de ${soles(datos.total)}?`)) return

    datos.codigosPendientes.forEach((codigo) => pagarDeuda(correo, codigo))
    asignarDeuda(correo, null)
    desbloquearCuenta(correo)
    recargar(`Pago de ${soles(datos.total)} registrado. La cuenta quedó al día.`)
  }

  const alternarBloqueo = () => {
    if (!datos) return

    if (datos.cuenta.bloqueada) {
      desbloquearCuenta(correo)
      recargar('Cuenta desbloqueada.')
      return
    }

    if (!window.confirm('¿Bloquear esta cuenta? El estudiante no podrá iniciar sesión.')) return

    const resultado = bloquearCuenta(correo)
    if (!resultado.ok) { recargar('No pudimos bloquear la cuenta: la estudiante tiene un préstamo entregado sin devolver. Registra primero la devolución.'); return }
    if (datos.total > 0) {
      asignarDeuda(correo, { monto: datos.total, prestamo: datos.codigosPendientes[0] })
    }
    recargar('Cuenta bloqueada. Aparece con deuda y no podrá iniciar sesión.')
  }

  /* ---------- sin cuenta ---------- */
  if (!datos) {
    return (
      <div className="hs-pagina">
        <HeaderEncargado />
        <div className="hs-cuerpo">
          <aside className="hs-lateral">
            <Operacion activo="usuarios" onCambiar={(id) => navigate(RUTAS[id])} />
          </aside>
          <main className="hs-main">
            <h1 className="hs-titulo">Historial del estudiante</h1>
            <p className="hs-vacio">
              {correo ? `No existe una cuenta con el correo ${correo}.` : 'Indica un estudiante para ver su historial.'}
            </p>
          </main>
        </div>
        <FooterEncargado />
      </div>
    )
  }

  const { cuenta, filas, total, retrasos, diasPendientes, codigosPendientes, faltantesPendientes } = datos
  const nombre = `${cuenta.nombres} ${cuenta.apellidos}`.trim()
  const conDeuda = total > 0
  const bloqueada = Boolean(cuenta.bloqueada)

  const detalle = [
    cuenta.carrera,
    cuenta.ciclo ? `${cuenta.ciclo} ciclo` : '',
    cuenta.codigo ? `código ${cuenta.codigo}` : '',
    cuenta.correo
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="hs-pagina">
      <HeaderEncargado />

      <div className="hs-cuerpo">
        <aside className="hs-lateral">
          <Operacion activo="usuarios" onCambiar={(id) => navigate(RUTAS[id])} />
        </aside>

        <main className="hs-main">
          <nav className="hs-migas" aria-label="Ruta">
            <button type="button" className="hs-miga" onClick={() => navigate(RUTAS.usuarios)}>
              Usuarios
            </button>
            {' / Estudiantes / '}
            <span>{nombre}</span>
          </nav>

          <div className="hs-cabecera">
            <div>
              <h1 className="hs-titulo">{nombre}</h1>
              {datos.cuenta.historial?.map((evento, i) => <p key={i}>{evento.accion}: {evento.motivo} · {evento.detalle} · {evento.fecha}</p>)}
              <p className="hs-detalle">{detalle}</p>
            </div>

            <div className="hs-botones">
              <button
                type="button"
                className="hs-boton"
                onClick={registrarPago}
                disabled={!conDeuda}
              >
                Registrar pago
              </button>
              <button
                type="button"
                className={`hs-boton ${bloqueada ? '' : 'hs-boton--peligro'}`}
                onClick={alternarBloqueo}
              >
                {bloqueada ? 'Desbloquear cuenta' : 'Bloquear cuenta'}
              </button>
            </div>
          </div>

          {mensaje && (
            <p className="hs-ok" role="status">
              {mensaje}
            </p>
          )}

          {conDeuda && (
            <div className="hs-aviso" role="alert">
              <strong>Aviso de deuda pendiente.</strong>{' '}
              <span className="hs-mono">{soles(total)}</span> por {diasPendientes}{' '}
              {diasPendientes === 1 ? 'día' : 'días'} de retraso en {codigosPendientes.join(', ')}
              {faltantesPendientes > 0 &&
                `, más ${faltantesPendientes} ${
                  faltantesPendientes === 1 ? 'accesorio faltante' : 'accesorios faltantes'
                } por valorizar`}
              .{' '}
              {bloqueada
                ? 'La cuenta está bloqueada: el estudiante no puede iniciar sesión ni solicitar equipos.'
                : 'Regulariza el pago para evitar el bloqueo de la cuenta.'}
            </div>
          )}

          <div className="hs-tarjetas">
            <div className="hs-tarjeta">
              <span className="hs-tarjeta-etiqueta">Préstamos</span>
              <span className="hs-tarjeta-valor">{filas.length}</span>
            </div>
            <div className="hs-tarjeta">
              <span className="hs-tarjeta-etiqueta">Retrasos acumulados</span>
              <span className={`hs-tarjeta-valor ${retrasos > 0 ? 'hs-rojo' : ''}`}>{retrasos}</span>
            </div>
            <div className="hs-tarjeta">
              <span className="hs-tarjeta-etiqueta">Penalidades</span>
              <span className={`hs-tarjeta-valor hs-mono ${conDeuda ? 'hs-ambar' : ''}`}>
                {soles(total)}
              </span>
            </div>
            <div className="hs-tarjeta">
              <span className="hs-tarjeta-etiqueta">Estado</span>
              <span className="hs-estados">
                <span className={`hs-estado ${conDeuda ? 'hs-estado--deuda' : 'hs-estado--ok'}`}>
                  {conDeuda ? 'Con deuda' : 'Al día'}
                </span>
                {bloqueada && <span className="hs-estado hs-estado--bloqueada">Bloqueada</span>}
              </span>
            </div>
          </div>

          <div className="hs-tabla">
            <div className="hs-fila hs-fila--cabecera">
              <span>Préstamo</span>
              <span>Equipo y unidad</span>
              <span>Entrega</span>
              <span>Devolución</span>
              <span>Retraso</span>
              <span>Penalidad</span>
            </div>

            {filas.length === 0 && <p className="hs-vacio">Este estudiante aún no tiene préstamos.</p>}

            {filas.map((f) => (
              <div className="hs-fila" key={f.codigo}>
                <span className="hs-codigo">{f.codigo}</span>
                <span>
                  {f.equipo} · <span className="hs-mono">{f.unidad}</span>
                </span>
                <span className="hs-mono">{formatear(f.entrega)}</span>
                <span className="hs-mono">{formatear(f.devolucion)}</span>
                <span>
                  {f.dias > 0 ? (
                    <span className="hs-chip-retraso">{f.dias} d</span>
                  ) : (
                    <span className="hs-guion">—</span>
                  )}
                </span>
                <span className="hs-mono">
                  {f.pendiente > 0 ? (
                    <span className="hs-pen-pendiente">{soles(f.pendiente)}</span>
                  ) : f.pagado > 0 ? (
                    <span className="hs-pen-pagada">{soles(f.pagado)} pagada</span>
                  ) : (
                    <span className="hs-guion">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>

      <FooterEncargado />
    </div>
  )
}

export default Historial
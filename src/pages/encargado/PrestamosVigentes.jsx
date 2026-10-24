import { useActualizacion } from '../../data/Actualizacion'
// src/pages/encargado/PrestamosVigentes.jsx
import { useNavigate } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { obtenerPrestamos } from '../../data/Identificacion'
import { obtenerCuenta } from '../../data/cuentas'
import './PrestamosVigentes.css'

const MS_DIA = 1000 * 60 * 60 * 24

// Ajusta estas rutas a las de tu proyecto
const RUTAS = {
  inventario: '/encargado/inventario',
  solicitudes: '/encargado/aprobacion-entrega',
  prestamos: '/encargado/prestamos-vigentes',
  vencidos: '/encargado/prestamos-vigentes?vencidos=1',
  devoluciones: '/encargado/devoluciones'
}

// 'AAAA-MM-DD' -> Date local (evita desfases de zona horaria)
function parsearFecha(texto) {
  const [anio, mes, dia] = String(texto).split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function formatearFecha(texto) {
  const [anio, mes, dia] = String(texto).split('-')
  return `${dia}/${mes}/${anio}`
}

function nombreEstudiante(correo) {
  const cuenta = obtenerCuenta(correo)
  if (!cuenta) return correo
  return `${cuenta.nombres} ${cuenta.apellidos}`.trim()
}

function clasificar() {
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  const vigentes = obtenerPrestamos()
    .filter((p) => p.estado === 'Entregado')
    .map((p) => {
      const dias = Math.round((parsearFecha(p.hasta) - hoy) / MS_DIA)
      return {
        codigo: p.codigo,
        unidad: p.unidad,
        vencimiento: p.hasta,
        estudiante: nombreEstudiante(p.correo),
        dias
      }
    })
    .sort((a, b) => a.dias - b.dias)

  return {
    vencidos: vigentes.filter((p) => p.dias < 0),
    hoy: vigentes.filter((p) => p.dias === 0),
    enCurso: vigentes.filter((p) => p.dias > 0),
    total: vigentes.length
  }
}

function PrestamosVigentes() {
  const navigate = useNavigate()
  useActualizacion()
  const { vencidos, hoy, enCurso, total } = clasificar()

  const registrarDevolucion = (codigo) =>
    navigate(`${RUTAS.devoluciones}?prestamo=${codigo}`)

  const renovar = (codigo) =>
    navigate(`${RUTAS.devoluciones}?prestamo=${codigo}`)

  return (
    <div className="pv-pagina">
      <HeaderEncargado />

      <div className="pv-cuerpo">
        <aside className="pv-lateral">
          <Operacion activo="prestamos" onCambiar={(id) => navigate(RUTAS[id])} />
        </aside>

        <main className="pv-main">
          <h1 className="pv-titulo">Préstamos vigentes</h1>
          <p className="pv-subtitulo">
            {total} {total === 1 ? 'préstamo activo' : 'préstamos activos'} · {hoy.length} vence
            hoy · {vencidos.length} {vencidos.length === 1 ? 'vencido' : 'vencidos'}
          </p>

          {total === 0 && <p className="pv-vacio">No hay préstamos vigentes por ahora.</p>}

          {vencidos.length > 0 && (
            <section className="pv-seccion">
              <h2 className="pv-etiqueta pv-etiqueta--rojo">VENCIDOS · {vencidos.length}</h2>
              <div className="pv-tabla pv-tabla--vencidos">
                <div className="pv-fila pv-fila--cabecera">
                  <span>Préstamo</span>
                  <span>Unidad</span>
                  <span>Estudiante</span>
                  <span>Vencimiento</span>
                  <span>Retraso</span>
                  <span>Acción</span>
                </div>
                {vencidos.map((p) => (
                  <div className="pv-fila" key={p.codigo}>
                    <span className="pv-codigo">{p.codigo}</span>
                    <span className="pv-mono">{p.unidad}</span>
                    <span>{p.estudiante}</span>
                    <span className="pv-mono">{formatearFecha(p.vencimiento)}</span>
                    <span>
                      <span className="pv-chip pv-chip--retraso">{Math.abs(p.dias)} d de retraso</span>
                    </span>
                    <span>
                      <button className="pv-accion" onClick={() => registrarDevolucion(p.codigo)}>
                        Registrar devolución
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hoy.length > 0 && (
            <section className="pv-seccion">
              <h2 className="pv-etiqueta pv-etiqueta--ambar">VENCEN HOY · {hoy.length}</h2>
              <div className="pv-tabla pv-tabla--hoy">
                {hoy.map((p) => (
                  <div className="pv-fila" key={p.codigo}>
                    <span className="pv-codigo">{p.codigo}</span>
                    <span className="pv-mono">{p.unidad}</span>
                    <span>{p.estudiante}</span>
                    <span className="pv-mono">{formatearFecha(p.vencimiento)}</span>
                    <span>
                      <span className="pv-chip pv-chip--hoy">vence hoy</span>
                    </span>
                    <span>
                      <button className="pv-accion" onClick={() => registrarDevolucion(p.codigo)}>
                        Registrar devolución
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {enCurso.length > 0 && (
            <section className="pv-seccion">
              <h2 className="pv-etiqueta">EN CURSO · {enCurso.length}</h2>
              <div className="pv-tabla">
                <div className="pv-fila pv-fila--cabecera">
                  <span>Préstamo</span>
                  <span>Unidad</span>
                  <span>Estudiante</span>
                  <span>Vencimiento</span>
                  <span>Días restantes</span>
                  <span>Acción</span>
                </div>
                {enCurso.map((p) => (
                  <div className="pv-fila" key={p.codigo}>
                    <span className="pv-codigo">{p.codigo}</span>
                    <span className="pv-mono">{p.unidad}</span>
                    <span>{p.estudiante}</span>
                    <span className="pv-mono">{formatearFecha(p.vencimiento)}</span>
                    <span>
                      <span className="pv-chip pv-chip--curso">vence en {p.dias} d</span>
                    </span>
                    <span className="pv-acciones">
                      <button className="pv-accion" onClick={() => registrarDevolucion(p.codigo)}>
                        Devolución
                      </button>
                      <span className="pv-punto"> · </span>
                      <button className="pv-accion" onClick={() => renovar(p.codigo)}>
                        Renovar
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <FooterEncargado />
    </div>
  )
}

export default PrestamosVigentes
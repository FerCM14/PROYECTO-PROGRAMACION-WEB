import { useActualizacion } from '../../data/Actualizacion'
import { obtenerInventario } from '../../data/Inventario'
// src/pages/encargado/ListaEspera.jsx
// Lista de espera: por cada producto, los estudiantes con solicitud en espera.
import { useNavigate } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'
import { obtenerTodasLasSolicitudes } from '../../data/Solicitudes'
import { obtenerCuenta } from '../../data/cuentas'
import { totalDeuda } from '../../data/deudas'
import './ListaEspera.css'

// Ajusta estas rutas a las de tu proyecto
const RUTAS = {
  inventario: '/encargado/inventario',
  solicitudes: '/encargado/aprobacion-entrega',
  prestamos: '/encargado/prestamos-vigentes',
  vencidos: '/encargado/prestamos-vigentes?vencidos=1',
  devoluciones: '/encargado/devoluciones'
}

/* =====================================================================
   ADAPTADOR: aquí se asume la forma de tus datos. Si tus archivos usan
   otros nombres de campo, cámbialos solo en estas funciones.
   ===================================================================== */

// Productos.js: se asume localStorage 'productos' con
//   [{ id, nombre, unidades: [{ codigo, estado }] }]
const leerProductos = obtenerInventario

// Solicitudes en espera: las que siguen en estado "Enviada"
function esperando(solicitud) {
  return solicitud.estado === 'Enviada'
}

function productoDe(solicitud) {
  return {
    id: solicitud.productoId ?? solicitud.equipoId ?? null,
    nombre: solicitud.equipo || solicitud.producto || solicitud.nombreEquipo || 'Equipo sin nombre'
  }
}

function fechasDe(solicitud) {
  return {
    desde: solicitud.desde || solicitud.fechaInicio || solicitud.fechaEntrega || solicitud.inicio || '',
    hasta: solicitud.hasta || solicitud.fechaDevolucion || solicitud.fechaFin || solicitud.devolucion || ''
  }
}

/* ===================================================================== */

function corta(texto) {
  const [, mes, dia] = String(texto).slice(0, 10).split('-')
  return mes && dia ? `${dia}/${mes}` : ''
}

function rango({ desde, hasta }) {
  if (!desde || !hasta) return '—'
  const [anio] = String(hasta).split('-')
  return `${corta(desde)} → ${corta(hasta)}/${anio}`
}

function nombreEstudiante(correo) {
  const cuenta = obtenerCuenta(correo)
  return cuenta ? `${cuenta.nombres} ${cuenta.apellidos}`.trim() : correo
}

function tieneDeuda(correo) {
  const cuenta = obtenerCuenta(correo)
  return Boolean(cuenta && (cuenta.deuda || cuenta.bloqueada)) || totalDeuda(correo) > 0
}

const enMantenimiento = (u) => String(u.estado).toLowerCase().includes('mantenim')
const disponible = (u) => String(u.estado).toLowerCase() === 'disponible'

function armarColas() {
  const productos = leerProductos()
  const grupos = new Map()

  obtenerTodasLasSolicitudes()
    .filter(esperando)
    .sort((a, b) =>
      String(a.fecha || '').localeCompare(String(b.fecha || '')) ||
      String(a.codigo).localeCompare(String(b.codigo))
    )
    .forEach((s) => {
      const producto = productoDe(s)
      const clave = producto.id ?? producto.nombre
      if (!grupos.has(clave)) grupos.set(clave, { producto, solicitudes: [] })
      grupos.get(clave).solicitudes.push(s)
    })

  return [...grupos.values()].map(({ producto, solicitudes }) => {
    const datos = productos.find(
      (p) => (producto.id !== null && p.id === producto.id) || p.nombre === producto.nombre
    )
    const unidades = datos?.unidades || []
    const mantenimiento = unidades.filter(enMantenimiento)
    const libres = unidades.filter(disponible)

    // Sin unidades libres y con alguna en mantenimiento: la cola no avanza
    const enPausa = unidades.length > 0 && libres.length === 0 && mantenimiento.length > 0

    return {
      clave: producto.id ?? producto.nombre,
      nombre: datos?.nombre || producto.nombre,
      mantenimiento,
      enPausa,
      filas: solicitudes.map((s, i) => {
        const deuda = tieneDeuda(s.correo)
        let accion = 'asignar'
        if (deuda) accion = 'deuda'
        else if (enPausa) accion = 'pausa'
        else if (unidades.length > 0 && libres.length === 0) accion = 'sinunidad'

        return {
          codigo: s.codigo,
          posicion: i + 1,
          estudiante: nombreEstudiante(s.correo),
          fechas: rango(fechasDe(s)),
          accion
        }
      })
    }
  })
}

function ListaEspera() {
  const navigate = useNavigate()
  useActualizacion()
  const colas = armarColas()

  const estudiantes = colas.reduce((suma, c) => suma + c.filas.length, 0)

  const asignar = (codigo) => navigate(`${RUTAS.solicitudes}?solicitud=${codigo}`)

  return (
    <div className="le-pagina">
      <HeaderEncargado />

      <div className="le-cuerpo">
        <aside className="le-lateral">
          <Operacion activo="espera" onCambiar={(id) => navigate(RUTAS[id])} />
        </aside>

        <main className="le-main">
          <h1 className="le-titulo">Lista de espera</h1>
          <p className="le-subtitulo">
            {colas.length} {colas.length === 1 ? 'equipo con reservas' : 'equipos con reservas'} en
            espera · {estudiantes} {estudiantes === 1 ? 'estudiante' : 'estudiantes'} en cola
          </p>

          {colas.length === 0 && (
            <p className="le-vacio">No hay estudiantes esperando un equipo por ahora.</p>
          )}

          <div className="le-grid">
            {colas.map((cola) => (
              <section className="le-tarjeta" key={cola.clave}>
                <header className="le-cabecera">
                  <strong>{cola.nombre}</strong>
                  <span className="le-cantidad"> · {cola.filas.length} en espera</span>
                </header>

                <ol className="le-lista">
                  {cola.filas.map((f) => (
                    <li className="le-fila" key={f.codigo}>
                      <span className="le-pos">{f.posicion}</span>
                      <span className="le-nombre">{f.estudiante}</span>
                      <span className="le-fechas">{f.fechas}</span>
                      <span className="le-accion">
                        {f.accion === 'asignar' && (
                          <button type="button" className="le-asignar" onClick={() => asignar(f.codigo)}>
                            Asignar
                          </button>
                        )}
                        {f.accion === 'deuda' && <span className="le-deuda">Con deuda</span>}
                        {f.accion === 'pausa' && <span className="le-pausa">En pausa</span>}
                        {f.accion === 'sinunidad' && <span className="le-pausa">Sin unidad libre</span>}
                      </span>
                    </li>
                  ))}
                </ol>

                {cola.enPausa && (
                  <p className="le-nota" role="status">
                    {cola.mantenimiento.length === 1 ? 'La unidad ' : 'Las unidades '}
                    {cola.mantenimiento.map((u, i) => (
                      <span key={u.codigo}>
                        {i > 0 && ', '}
                        <span className="le-mono">{u.codigo}</span>
                      </span>
                    ))}{' '}
                    {cola.mantenimiento.length === 1 ? 'está' : 'están'} en mantenimiento: la cola de
                    este equipo no avanzará hasta que vuelva al inventario.
                  </p>
                )}
              </section>
            ))}
          </div>
        </main>
      </div>

      <FooterEncargado />
    </div>
  )
}

export default ListaEspera
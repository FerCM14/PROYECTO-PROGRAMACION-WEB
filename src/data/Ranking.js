import { obtenerInventario } from './Inventario'
import { obtenerTodasLasSolicitudes, ultimaSolicitudProducto } from './Solicitudes'
import { obtenerCuentas } from './cuentas'
import { obtenerPrestamos } from './Identificacion'
import { obtenerRetrasos } from './retrasos'
import { hoyISO, diferenciaDias } from './fechas'
export function calcularRanking({ desde, hasta, categoria = '' }) {
  const productos = obtenerInventario().filter((p) => !categoria || p.categoria === categoria)
  const todas = obtenerTodasLasSolicitudes()
  const coincide = (s, p) => Number(s.productoId) === p.id || s.equipo === p.nombre || p.unidades.some((u) => u.codigo === s.unidad)
  const fecha = (s) => String(s.fecha || s.desde || s.inicio || '').slice(0,10)
  const periodo = todas.filter((s) => fecha(s) >= desde && fecha(s) <= hasta)
  const filas = productos.map((p) => {
    const solicitudes = periodo.filter((s) => coincide(s,p))
    const ultimaSolicitud = ultimaSolicitudProducto(p)
    const ultima = ultimaSolicitud ? fecha(ultimaSolicitud) : ''
    return { ...p, prestamos: solicitudes.length, porcentaje: p.unidades.length ? solicitudes.length / p.unidades.length * 100 : 0, ultima }
  })
  const cuentas = obtenerCuentas().filter((c) => c.rol === 'estudiante')
  const carreras = [...new Set(cuentas.map((c) => c.carrera).filter(Boolean))].map((carrera) => {
    const correos = new Set(cuentas.filter((c) => c.carrera === carrera).map((c) => c.correo))
    const total = periodo.filter((s) => correos.has(s.correo) && productos.some((p) => coincide(s,p))).length
    return { carrera, total }
  })
  const total = carreras.reduce((s,c) => s+c.total,0)
  const meses = []; let mes = desde.slice(0,7)
  while (mes <= hasta.slice(0,7) && meses.length < 120) {
    const valores = [...new Set(productos.map((p) => p.categoria))].map((categoria) => ({ categoria, total: periodo.filter((s) => fecha(s).startsWith(mes) && productos.some((p) => p.categoria === categoria && coincide(s,p))).length }))
    meses.push({ mes, valores }); const [a,m] = mes.split('-').map(Number); mes = `${m === 12 ? a+1:a}-${String(m === 12 ? 1:m+1).padStart(2,'0')}`
  }
  return { mas: filas.filter((p) => p.prestamos).sort((a,b) => b.prestamos-a.prestamos), sin: filas.filter((p) => !p.prestamos), carreras: carreras.map((c) => ({ ...c, porcentaje: total ? c.total/total*100:0 })), meses }
}
export function usuariosConResumen() {
  const solicitudes = obtenerTodasLasSolicitudes(); const prestamos = obtenerPrestamos()
  return obtenerCuentas().filter((c) => c.rol === 'estudiante').map((c) => {
    const conRetraso = prestamos.filter((p) => p.correo === c.correo && ((p.devolucion?.diasRetraso || 0) > 0 || (p.estado === 'Entregado' && p.hasta < hoyISO())))
    const codigos = new Set(conRetraso.map((p) => p.codigo))
    const retrasos = conRetraso.length + obtenerRetrasos(c.correo).filter((r) => !codigos.has(r.codigo)).length
    const dias = conRetraso.reduce((s,p) => s+(p.devolucion?.diasRetraso || Math.max(0,diferenciaDias(p.hasta,hoyISO()) || 0)),0)
    const estado = c.bloqueada ? 'Bloqueado' : c.deuda ? 'Con deuda' : 'Habilitado'
    return { ...c, codigo: c.correo.split('@')[0], prestamos: solicitudes.filter((s) => s.correo === c.correo).length, retrasos, dias, estado, monto: estado === 'Habilitado' ? 0 : retrasos*15 }
  })
}

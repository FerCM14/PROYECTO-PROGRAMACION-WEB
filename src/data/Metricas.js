import { obtenerInventario } from './Inventario'
// src/data/Metricas.js
// Cálculo de las métricas del Tablero y exportación a CSV.
// Usa: Prestamos.js, Cuentas.js, Deudas.js y Fechas.js (el archivo de fechas y disponibilidad).

import { obtenerPrestamos } from './Identificacion'
import { obtenerCuenta, obtenerSesion } from './cuentas'
import { PENALIDAD_POR_DIA } from './deudas'
import { hoyISO, sumarDias, diferenciaDias, formatearFecha } from './fechas'

/* Colores de los números, barras y bordes del tablero */
export const COLORES = {
  periodo: { acento: '#1d4f5c', texto: '#16222a' },
  disponibles: { acento: '#1e7a4a', texto: '#1e7a4a' },
  vencidos: { acento: '#b3261e', texto: '#b3261e' },
  mantenimiento: { acento: '#d4a30a', texto: '#b9770e' },
  barras: '#174f5c',
  inventario: {
    disponibles: '#1e7a4a',
    prestadas: '#2f6aa3',
    mantenimiento: '#d4a30a',
    baja: '#5f6b73'
  }
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/* =====================================================================
   ADAPTADOR de Productos.js: se asume localStorage 'productos' con
   [{ id, nombre, almacen?, unidades: [{ codigo, estado }] }]
   Si tu estructura es distinta, cámbialo solo aquí.
   ===================================================================== */
const leerProductos = obtenerInventario

export function almacenActual() {
  const sesion = obtenerSesion()
  const cuenta = sesion ? obtenerCuenta(sesion.correo) : null
  return cuenta?.almacen || sesion?.almacen || ''
}

function fechaEntrega(p) {
  return String(p.entrega?.fechaEntrega || p.desde || '').slice(0, 10)
}

function fechaRetorno(p) {
  return String(p.devolucion?.fechaRetorno || '').slice(0, 10)
}

function enRango(fecha, desde, hasta) {
  return Boolean(fecha) && fecha >= desde && fecha <= hasta
}

function nombreEstudiante(correo) {
  const cuenta = obtenerCuenta(correo)
  return cuenta ? `${cuenta.nombres} ${cuenta.apellidos}`.trim() : correo
}

export function calcularMetricas({ desde, hasta, almacen = '' }) {
  const hoy = hoyISO()

  // Solo productos del almacén del encargado (los que no tienen almacén se incluyen)
  const productos = leerProductos().filter((p) => !almacen || !p.almacen || p.almacen === almacen)
  const unidades = productos.flatMap((p) =>
    (p.unidades || []).map((u) => ({ ...u, producto: p.nombre || '' }))
  )
  const codigosAlmacen = new Set(unidades.map((u) => u.codigo))

  const todos = obtenerPrestamos()
    .filter((p) => p.estado === 'Entregado' || p.estado === 'Devuelto')
    .filter((p) => codigosAlmacen.size === 0 || codigosAlmacen.has(p.unidad))

  /* ---------- préstamos del periodo y variación ---------- */
  const periodo = todos.filter((p) => enRango(fechaEntrega(p), desde, hasta))

  const largo = diferenciaDias(desde, hasta) + 1
  const antesHasta = sumarDias(desde, -1)
  const antesDesde = sumarDias(desde, -largo)
  const anterior = todos.filter((p) => enRango(fechaEntrega(p), antesDesde, antesHasta))
  const variacion = anterior.length
    ? Math.round(((periodo.length - anterior.length) / anterior.length) * 100)
    : null

  /* ---------- estado del inventario ---------- */
  const activos = todos.filter((p) => p.estado === 'Entregado')
  const enPrestamo = new Set(activos.map((p) => p.unidad))

  let disponibles = 0
  let prestadas = 0
  let mantenimiento = 0
  let baja = 0

  unidades.forEach((u) => {
    const e = String(u.estado || '').toLowerCase()
    if (e.includes('baja')) baja += 1
    else if (e.includes('mantenim')) mantenimiento += 1
    else if (e.includes('prest') || enPrestamo.has(u.codigo)) prestadas += 1
    else if (e.includes('dispon')) disponibles += 1
  })

  /* ---------- vencidos (hoy) y penalidad estimada ---------- */
  const vencidos = activos.filter((p) => p.hasta < hoy)
  const penalidad = vencidos.reduce(
    (suma, p) => suma + diferenciaDias(p.hasta, hoy) * PENALIDAD_POR_DIA,
    0
  )

  /* ---------- préstamos por mes (solo meses del rango, máx. 12) ---------- */
  const meses = []
  let [anio, mes] = desde.split('-').map(Number)
  const [anioFin, mesFin] = hasta.split('-').map(Number)
  const variosAnios = anio !== anioFin

  while (anio < anioFin || (anio === anioFin && mes <= mesFin)) {
    meses.push({ anio, mes })
    mes += 1
    if (mes > 12) {
      mes = 1
      anio += 1
    }
  }

  const barras = meses.slice(-12).map(({ anio: a, mes: m }) => {
    const clave = `${a}-${String(m).padStart(2, '0')}`
    return {
      clave,
      etiqueta: variosAnios ? `${MESES[m - 1]} ${String(a).slice(2)}` : MESES[m - 1],
      total: periodo.filter((p) => fechaEntrega(p).startsWith(clave)).length
    }
  })

  /* ---------- datos de la franja inferior ---------- */
  const devueltos = todos.filter(
    (p) => p.estado === 'Devuelto' && enRango(fechaRetorno(p), desde, hasta)
  )

  const promedio = devueltos.length
    ? devueltos.reduce((s, p) => s + diferenciaDias(fechaEntrega(p), fechaRetorno(p)), 0) /
      devueltos.length
    : null

  const aTiempo = devueltos.length
    ? Math.round(
        (devueltos.filter((p) => !(p.devolucion?.diasRetraso > 0)).length / devueltos.length) * 100
      )
    : null

  const conteoUnidades = {}
  periodo.forEach((p) => {
    conteoUnidades[p.unidad] = (conteoUnidades[p.unidad] || 0) + 1
  })
  const masSolicitada =
    Object.entries(conteoUnidades).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  /* ---------- registros para exportar ---------- */
  const detalle = periodo
    .slice()
    .sort((a, b) => fechaEntrega(a).localeCompare(fechaEntrega(b)))
    .map((p) => ({
      codigo: p.codigo,
      equipo: p.equipo || '',
      unidad: p.unidad,
      estudiante: nombreEstudiante(p.correo),
      correo: p.correo,
      entrega: fechaEntrega(p),
      pactada: p.hasta,
      retorno: fechaRetorno(p),
      estado: p.estado,
      retraso: p.estado === 'Devuelto' ? p.devolucion?.diasRetraso || 0 : Math.max(0, diferenciaDias(p.hasta, hoy))
    }))

  const total = unidades.length
  const inventario = [
    { id: 'disponibles', etiqueta: 'Disponibles', valor: disponibles, color: COLORES.inventario.disponibles },
    { id: 'prestadas', etiqueta: 'Prestadas', valor: prestadas, color: COLORES.inventario.prestadas },
    { id: 'mantenimiento', etiqueta: 'En mantenimiento', valor: mantenimiento, color: COLORES.inventario.mantenimiento },
    { id: 'baja', etiqueta: 'Dadas de baja', valor: baja, color: COLORES.inventario.baja }
  ]

  return {
    hoy,
    periodo: periodo.length,
    variacion,
    total,
    disponibles,
    mantenimiento,
    vencidos: vencidos.length,
    penalidad,
    barras,
    inventario,
    promedio,
    aTiempo,
    masSolicitada,
    detalle,
    unidades
  }
}

/* ---------- exportación ---------- */
function celda(valor) {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`
}

function fila(...valores) {
  return valores.map(celda).join(',')
}

const fechaOGuion = (iso) => (iso ? formatearFecha(iso) : '—')

// Genera un CSV (con BOM para que Excel respete los acentos) y lo descarga en el PC
export function exportarCSV(metricas, { almacen, desde, hasta }) {
  const m = metricas
  const lineas = [
    fila('Tablero del almacén'),
    fila('Almacén', almacen || 'Sin almacén asignado'),
    fila('Periodo', `${formatearFecha(desde)} a ${formatearFecha(hasta)}`),
    fila('Exportado el', formatearFecha(m.hoy)),
    '',
    fila('INDICADORES'),
    fila('Préstamos del periodo', m.periodo),
    fila('Unidades disponibles', m.disponibles, `de ${m.total} registradas`),
    fila('Préstamos vencidos', m.vencidos, `S/ ${m.penalidad.toFixed(2)} en penalidades`),
    fila('En mantenimiento', m.mantenimiento),
    fila('Tiempo promedio de préstamo (días)', m.promedio === null ? '—' : m.promedio.toFixed(1)),
    fila('Devoluciones a tiempo (%)', m.aTiempo === null ? '—' : m.aTiempo),
    fila('Unidad más solicitada', m.masSolicitada || '—'),
    '',
    fila('PRÉSTAMOS POR MES'),
    fila('Mes', 'Préstamos'),
    ...m.barras.map((b) => fila(b.etiqueta, b.total)),
    '',
    fila('ESTADO DEL INVENTARIO'),
    fila('Estado', 'Unidades'),
    ...m.inventario.map((i) => fila(i.etiqueta, i.valor)),
    '',
    fila('PRÉSTAMOS DEL PERIODO'),
    fila('Préstamo', 'Equipo', 'Unidad', 'Estudiante', 'Correo', 'Entrega', 'Devolución pactada', 'Devolución real', 'Estado', 'Días de retraso'),
    ...m.detalle.map((d) =>
      fila(d.codigo, d.equipo, d.unidad, d.estudiante, d.correo, fechaOGuion(d.entrega), fechaOGuion(d.pactada), fechaOGuion(d.retorno), d.estado, d.retraso)
    ),
    '',
    fila('UNIDADES DEL ALMACÉN'),
    fila('Unidad', 'Producto', 'Estado'),
    ...m.unidades.map((u) => fila(u.codigo, u.producto, u.estado))
  ]

  const contenido = '\uFEFF' + lineas.join('\r\n')
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const nombre = `metricas-${(almacen || 'almacen').replace(/\s+/g, '-')}_${desde}_${hasta}.csv`

  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)

  return nombre
}
export function periodoInicial() {
  const hoy = hoyISO(); const fecha = new Date(`${hoy}T12:00:00`)
  fecha.setMonth(fecha.getMonth() - 1, 1)
  return { desde: `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-01`, hasta: hoy }
}

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

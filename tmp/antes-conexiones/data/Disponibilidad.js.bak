// Fechas y disponibilidad de equipos (datos de ejemplo).
// Los rangos ocupados son los días en que NO quedan unidades libres.
// Se definen en días contados desde hoy, para que el ejemplo siempre sea vigente.

const OCUPACION = {
  2: [{ desde: 5, hasta: 9 }],
  4: [{ desde: 4, hasta: 10 }],
  5: [{ desde: 6, hasta: 10 }],
  6: [{ desde: 4, hasta: 7 }],
  10: [{ desde: 0, hasta: 9 }], // 0 libres: vuelve a haber el 02/11/2026
  15: [{ desde: 0, hasta: 13 }] // 0 libres: vuelve a haber el 06/11/2026
}

const DIA_MS = 24 * 60 * 60 * 1000

function aFecha(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function aISO(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function hoyISO() {
  return aISO(new Date())
}

export function sumarDias(iso, dias) {
  const fecha = aFecha(iso)
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

// devolución - inicio
export function diferenciaDias(desde, hasta) {
  return Math.round((aFecha(hasta) - aFecha(desde)) / DIA_MS)
}

export function formatearFecha(iso) {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

export function formatearCorto(iso) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

export function obtenerRangosOcupados(idProducto) {
  const hoy = hoyISO()

  return (OCUPACION[idProducto] || []).map((rango) => ({
    desde: sumarDias(hoy, rango.desde),
    hasta: sumarDias(hoy, rango.hasta)
  }))
}

// ¿El rango pedido toca algún día sin unidades libres?
export function hayConflicto(rangos, inicio, fin) {
  return rangos.some((rango) => inicio <= rango.hasta && fin >= rango.desde)
}

// Primer rango libre (de "dias" días) a partir de la fecha indicada
export function proximoRangoLibre(rangos, desde, dias = 5) {
  let candidato = desde

  for (let i = 0; i < 60; i += 1) {
    const fin = sumarDias(candidato, dias)
    const choque = rangos.find(
      (rango) => candidato <= rango.hasta && fin >= rango.desde
    )

    if (!choque) return { inicio: candidato, fin }
    candidato = sumarDias(choque.hasta, 1)
  }

  return { inicio: candidato, fin: sumarDias(candidato, dias) }
}
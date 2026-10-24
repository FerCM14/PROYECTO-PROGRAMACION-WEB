// src/data/Fechas.js
// Utilidades de fechas compartidas por las páginas del encargado.
// Todas las fechas se manejan como texto ISO "AAAA-MM-DD" (hora local, sin zona
// horaria) para evitar desfases con UTC: en Lima, toISOString() devolvería el
// día siguiente después de las 7 p. m.

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

function dosDigitos(n) {
  return String(n).padStart(2, '0')
}

// Convierte "AAAA-MM-DD" en un Date a medianoche local. Devuelve null si no es válida.
function aFecha(iso) {
  const partes = ISO.exec(String(iso || ''))
  if (!partes) return null
  const [, a, m, d] = partes.map(Number)
  const fecha = new Date(a, m - 1, d)
  const coincide = fecha.getFullYear() === a && fecha.getMonth() === m - 1 && fecha.getDate() === d
  return coincide ? fecha : null
}

// Convierte un Date en "AAAA-MM-DD" usando la hora local.
function aISO(fecha) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

// Fecha de hoy en formato ISO.
export function hoyISO() {
  return aISO(new Date())
}

// "2026-09-14" -> "14/09/2026". Si la fecha no es válida devuelve "—".
export function formatearFecha(iso) {
  const fecha = aFecha(iso)
  if (!fecha) return '—'
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
}

// "2026-09-14" -> "14 sep 2026"
export function formatearFechaCorta(iso) {
  const fecha = aFecha(iso)
  if (!fecha) return '—'
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`
}

// Suma (o resta, con negativos) días a una fecha ISO.
export function sumarDias(iso, dias) {
  const fecha = aFecha(iso)
  if (!fecha) return ''
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

// Días de diferencia entre dos fechas ISO: hasta - desde.
// diferenciaDias('2026-09-11', '2026-09-14') === 3
export function diferenciaDias(desde, hasta) {
  const a = aFecha(desde)
  const b = aFecha(hasta)
  if (!a || !b) return null
  // Se usa UTC para que los cambios de horario no alteren el conteo.
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / 86400000)
}

// Días que faltan para el vencimiento (negativo si ya venció).
export function diasRestantes(vencimiento, hoy = hoyISO()) {
  return diferenciaDias(hoy, vencimiento)
}

// Días de retraso (0 si aún no vence).
export function diasDeRetraso(vencimiento, hoy = hoyISO()) {
  const resto = diasRestantes(vencimiento, hoy)
  return resto === null ? 0 : Math.max(0, -resto)
}

// "2026-09-14" -> "2026-09" (para agrupar por mes)
export function claveMes(iso) {
  return ISO.test(String(iso || '')) ? iso.slice(0, 7) : ''
}

// "2026-09" -> "Sep 2026"
export function etiquetaMes(clave) {
  const [a, m] = String(clave).split('-').map(Number)
  if (!a || !m || m < 1 || m > 12) return ''
  const nombre = MESES_CORTOS[m - 1]
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${a}`
}

// "2026-09" -> "septiembre de 2026"
export function nombreMes(clave) {
  const [a, m] = String(clave).split('-').map(Number)
  if (!a || !m || m < 1 || m > 12) return ''
  return `${MESES_LARGOS[m - 1]} de ${a}`
}

// Lista de claves de mes ("AAAA-MM") entre dos fechas ISO, ambas incluidas.
// listarMeses('2026-07-20', '2026-09-14') -> ['2026-07', '2026-08', '2026-09']
export function listarMeses(desde, hasta) {
  const inicio = aFecha(desde)
  const fin = aFecha(hasta)
  if (!inicio || !fin || inicio > fin) return []
  const claves = []
  let a = inicio.getFullYear()
  let m = inicio.getMonth() + 1
  const ultimoA = fin.getFullYear()
  const ultimoM = fin.getMonth() + 1
  while (a < ultimoA || (a === ultimoA && m <= ultimoM)) {
    claves.push(`${a}-${dosDigitos(m)}`)
    m += 1
    if (m > 12) {
      m = 1
      a += 1
    }
  }
  return claves
}

// ¿La fecha está dentro del rango [desde, hasta]? (ambos extremos incluidos)
// Al ser texto ISO, la comparación alfabética equivale a la cronológica.
export function enRango(iso, desde, hasta) {
  return Boolean(iso) && iso >= desde && iso <= hasta
}

// Periodo inmediatamente anterior y de igual duración que [desde, hasta].
// Sirve para calcular la variación "frente al periodo anterior".
export function periodoAnterior(desde, hasta) {
  const duracion = diferenciaDias(desde, hasta)
  if (duracion === null || duracion < 0) return null
  const finAnterior = sumarDias(desde, -1)
  const inicioAnterior = sumarDias(finAnterior, -duracion)
  return { desde: inicioAnterior, hasta: finAnterior }
}
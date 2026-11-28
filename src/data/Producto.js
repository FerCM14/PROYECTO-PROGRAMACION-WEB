// Catálogo de equipos del almacén (datos de ejemplo).
// duracionMax: días máximos de préstamo (null = sin límite)

export const CATEGORIAS = [
  { id: 'robotica', nombre: 'Robótica', etiqueta: 'ROBÓTICA' },
  { id: 'medicion', nombre: 'Medición', etiqueta: 'MEDICIÓN' },
  { id: 'audiovisual', nombre: 'Audiovisual', etiqueta: 'AUDIOVISUAL' },
  { id: 'computo', nombre: 'Cómputo', etiqueta: 'CÓMPUTO' },
  { id: 'redes', nombre: 'Redes', etiqueta: 'REDES' },
  { id: 'fisica', nombre: 'Laboratorio de física', etiqueta: 'LAB. FÍSICA' }
]

export const PRODUCTOS = [
  { id: 1, imagen: '/imagenes/equipos/arduino-kit.webp', codigo: 'INV-0001', nombre: 'Kit de robótica Arduino Mega', marca: 'Arduino', modelo: 'Mega 2560', categoria: 'robotica', libres: 6, total: 6, duracionMax: 7 },
  { id: 2, imagen: '/imagenes/equipos/brazo-robotico-dobot.jpg', codigo: 'INV-0002', nombre: 'Brazo robótico Dobot', marca: 'Dobot', modelo: 'Magician Lite', categoria: 'robotica', libres: 2, total: 3, duracionMax: 7 },
  { id: 3, imagen: '/imagenes/equipos/kit-sensores-raspberry.jpg', codigo: 'INV-0003', nombre: 'Kit de sensores Raspberry Pi', marca: 'Raspberry', modelo: 'Pi 4 Model B', categoria: 'robotica', libres: 4, total: 5, duracionMax: 7 },
  { id: 4, imagen: '/imagenes/equipos/osciloscopio.jpg', codigo: 'INV-0004', nombre: 'Osciloscopio TBS1052B', marca: 'Tektronix', modelo: 'TBS1052B', categoria: 'medicion', libres: 3, total: 5, duracionMax: 7 },
  { id: 5, imagen: '/imagenes/equipos/camara-canon.jpg', codigo: 'INV-0005', nombre: 'Cámara Canon EOS 90D', marca: 'Canon', modelo: 'EOS 90D', categoria: 'audiovisual', libres: 2, total: 4, duracionMax: 7 },
  { id: 6, imagen: '/imagenes/equipos/tableta-wacom.jpg', codigo: 'INV-0006', nombre: 'Tableta gráfica Wacom Intuos', marca: 'Wacom', modelo: 'CTL-4100', categoria: 'computo', libres: 1, total: 3, duracionMax: 7 },
  { id: 7, imagen: '/imagenes/equipos/tripode-manfrotto.jpg', codigo: 'INV-0007', nombre: 'Trípode Manfrotto MT055', marca: 'Manfrotto', modelo: 'MT055', categoria: 'audiovisual', libres: 4, total: 5, duracionMax: 7 },
  { id: 8, imagen: '/imagenes/equipos/fuente-poder-regulable.jpg', codigo: 'INV-0008', nombre: 'Fuente de poder regulable', marca: 'Korad', modelo: 'KA3005P', categoria: 'fisica', libres: 3, total: 4, duracionMax: 7 },
  { id: 9, imagen: '/imagenes/equipos/multimetro.jpg', codigo: 'INV-0009', nombre: 'Multímetro digital Fluke 115', marca: 'Fluke', modelo: '115', categoria: 'medicion', libres: 8, total: 10, duracionMax: 15 },
  { id: 10, imagen: '/imagenes/equipos/laptop-dell.webp', codigo: 'INV-0010', nombre: 'Laptop Dell Latitude 5420', marca: 'Dell', modelo: 'Latitude 5420', categoria: 'computo', libres: 0, total: 6, duracionMax: 15 },
  { id: 11, imagen: '/imagenes/equipos/switch-cisco.jpg', codigo: 'INV-0011', nombre: 'Switch Cisco Catalyst 2960', marca: 'Cisco', modelo: 'Catalyst 2960', categoria: 'redes', libres: 2, total: 4, duracionMax: 15 },
  { id: 12, imagen: '/imagenes/equipos/router-mikrotik.webp', codigo: 'INV-0012', nombre: 'Router MikroTik hAP ac²', marca: 'MikroTik', modelo: 'hAP ac2', categoria: 'redes', libres: 3, total: 5, duracionMax: 15 },
  { id: 13, imagen: '/imagenes/equipos/microfono-shure.webp', codigo: 'INV-0013', nombre: 'Micrófono Shure SM58', marca: 'Shure', modelo: 'SM58', categoria: 'audiovisual', libres: 5, total: 6, duracionMax: 7 },
  { id: 14, imagen: '/imagenes/equipos/kit-optica.jpg', codigo: 'INV-0014', nombre: 'Kit de óptica Pasco', marca: 'Pasco', modelo: 'OS-8515C', categoria: 'fisica', libres: 1, total: 2, duracionMax: null },
  { id: 15, imagen: '/imagenes/equipos/analizador-logico.jpg', codigo: 'INV-0015', nombre: 'Analizador lógico Saleae', marca: 'Saleae', modelo: 'Logic Pro 8', categoria: 'medicion', libres: 0, total: 2, duracionMax: 15 },
  { id: 16, imagen: '/imagenes/equipos/mini-pc-intel-nuc.jpg', codigo: 'INV-0016', nombre: 'Mini PC Intel NUC 11', marca: 'Intel', modelo: 'NUC 11 Pro', categoria: 'computo', libres: 3, total: 4, duracionMax: null }
]

/* ---------- Datos para la página de detalle ---------- */

export const RECOJO = {
  lugar: 'Almacén H-102',
  horario: 'lunes a viernes de 08:00 a 19:00'
}

// prefijo + inicio generan los códigos de cada unidad (INV-OSC-0042, ...)
// autorizacion: requiere autorización del docente
// renovable: admite renovación
// proximaLiberacion: fecha (AAAA-MM-DD) en que se libera la próxima unidad
// estados: estado de cada unidad en orden (si se omite, se generan solos)
const DETALLES = {
  1: { prefijo: 'ARD', inicio: 10, descripcion: 'Kit con placa Arduino Mega 2560, protoboard, sensores y cables para prácticas de robótica y automatización.', accesorios: ['Cable USB', 'Protoboard', 'Kit de sensores', 'Estuche rígido'], autorizacion: false },
  2: { prefijo: 'DOB', inicio: 20, descripcion: 'Brazo robótico de escritorio de 4 ejes para prácticas de manipulación, dibujo y control de movimiento.', accesorios: ['Fuente de poder', 'Cable USB', 'Pinza neumática', 'Estuche rígido'], autorizacion: true },
  3: { prefijo: 'RPI', inicio: 30, descripcion: 'Raspberry Pi 4 con módulo de sensores para proyectos de IoT, visión y adquisición de datos.', accesorios: ['Fuente USB-C', 'Tarjeta microSD', 'Módulo de sensores', 'Estuche rígido'], autorizacion: false },
  4: { prefijo: 'OSC', inicio: 42, titulo: 'Osciloscopio Tektronix TBS1052B', descripcion: 'Osciloscopio digital de 2 canales y 50 MHz con pantalla a color. Para las prácticas de circuitos electrónicos y el laboratorio de señales.', accesorios: ['2 sondas de medición', 'Cable USB', 'Estuche rígido'], autorizacion: true, estados: ['Disponible', 'Disponible', 'Prestada', 'Mantenimiento', 'Disponible'] },
  5: { prefijo: 'CAM', inicio: 50, descripcion: 'Cámara réflex de 32.5 MP con grabación 4K para los cursos de producción audiovisual.', accesorios: ['Lente 18-135 mm', 'Batería y cargador', 'Tarjeta SD', 'Correa'], autorizacion: true },
  6: { prefijo: 'TAB', inicio: 60, descripcion: 'Tableta gráfica para diseño, bocetado y edición digital.', accesorios: ['Lápiz', 'Cable USB', 'Puntas de repuesto'], autorizacion: false },
  7: { prefijo: 'TRI', inicio: 70, descripcion: 'Trípode de aluminio con cabezal de 3 vías para cámaras y filmación en exteriores.', accesorios: ['Cabezal 3 vías', 'Placa rápida', 'Bolsa de transporte'], autorizacion: false },
  8: { prefijo: 'FUE', inicio: 80, descripcion: 'Fuente de poder DC regulable de 0-30 V y 0-5 A para prácticas de electrónica y física.', accesorios: ['Cable de alimentación', 'Cables banana-caimán'], autorizacion: false },
  9: { prefijo: 'MUL', inicio: 90, descripcion: 'Multímetro digital True RMS para medición de voltaje, corriente y resistencia.', accesorios: ['Puntas de prueba', 'Funda protectora'], autorizacion: false },
  10: { prefijo: 'LAP', inicio: 100, descripcion: 'Laptop para simulación, programación y trabajo de laboratorio fuera del campus.', accesorios: ['Cargador', 'Mouse', 'Maletín'], autorizacion: true, proximaLiberacion: '2026-11-02' },
  11: { prefijo: 'SWI', inicio: 110, descripcion: 'Switch administrable de 24 puertos para prácticas de configuración de redes.', accesorios: ['Cable de consola', 'Cable de alimentación'], autorizacion: false },
  12: { prefijo: 'ROU', inicio: 120, descripcion: 'Router inalámbrico de doble banda para laboratorios de redes y enrutamiento.', accesorios: ['Fuente de poder', 'Cable de red'], autorizacion: false },
  13: { prefijo: 'MIC', inicio: 130, descripcion: 'Micrófono dinámico cardioide para grabación de voz y presentaciones.', accesorios: ['Cable XLR', 'Soporte', 'Estuche'], autorizacion: false },
  14: { prefijo: 'OPT', inicio: 140, descripcion: 'Kit de óptica con banco, lentes, espejos y fuentes de luz para el laboratorio de física.', accesorios: ['Banco óptico', 'Set de lentes', 'Fuente de luz', 'Estuche rígido'], autorizacion: true },
  15: { prefijo: 'ANA', inicio: 150, descripcion: 'Analizador lógico de 8 canales para depurar buses digitales y protocolos de comunicación.', accesorios: ['Cable USB', 'Juego de clips de prueba'], autorizacion: true, proximaLiberacion: '2026-11-06' },
  16: { prefijo: 'NUC', inicio: 160, descripcion: 'Mini PC compacta para desarrollo, servidores de prueba y proyectos embebidos.', accesorios: ['Fuente de poder', 'Cable HDMI'], autorizacion: false }
}

function generarUnidades(producto, detalle) {
  const estados =
    detalle.estados ||
    Array.from({ length: producto.total }, (_, i) => {
      if (i < producto.libres) return 'Disponible'
      return (i - producto.libres) % 2 === 0 ? 'Prestada' : 'Mantenimiento'
    })

  return estados.map((estado, i) => ({
    codigo: `INV-${detalle.prefijo}-${String(detalle.inicio + i).padStart(4, '0')}`,
    estado
  }))
}

export function obtenerCategoria(id) {
  return CATEGORIAS.find((categoria) => categoria.id === id) || null
}

export function contarPorCategoria(id) {
  return PRODUCTOS.filter((producto) => producto.categoria === id).length
}

// Producto con todos los datos de la página de detalle
export function obtenerProducto(id) {
  const producto = PRODUCTOS.find((p) => p.id === Number(id))
  if (!producto) return null

  const detalle = DETALLES[producto.id] || { prefijo: 'EQP', inicio: 1 }

  const condiciones = leerJSON(`condiciones-${producto.id}`, {})
  const duracion = numeroGuardado(condiciones.dias)
  const unidades = [...generarUnidades(producto, detalle), ...(leerJSON('producto-unidades', {})[producto.id] || [])].map((u) => ({ ...u, ...(leerJSON('inventario-estados', {})[u.codigo] || {}) }))
  return {
    ...producto,
    total: unidades.length,
    duracionMax: condiciones.dias === null ? null : duracion ?? producto.duracionMax,
    penalizacion: numeroGuardado(condiciones.penalizacion) ?? 15,
    titulo: detalle.titulo || producto.nombre,
    descripcion: detalle.descripcion || '',
    accesorios: detalle.accesorios || [],
    autorizacion: typeof condiciones.requiereAutorizacion === 'boolean' ? condiciones.requiereAutorizacion : Boolean(detalle.autorizacion),
    renovable: typeof condiciones.admiteRenovacion === 'boolean' ? condiciones.admiteRenovacion : Boolean(detalle.renovable),
    proximaLiberacion: detalle.proximaLiberacion || null,
    unidades
  }
}

function numeroGuardado(valor) {
  if (typeof valor === 'string' && valor.trim()) valor = Number(valor)
  return Number.isFinite(valor) ? valor : undefined
}

/* ---------- Altas y ediciones (se guardan en localStorage) ---------- */
// Los datos de ejemplo de arriba no cambian. Los equipos nuevos y las
// ediciones se guardan aparte y se mezclan con ellos al cargar el módulo,
// así PRODUCTOS y obtenerProducto() los incluyen en todas las páginas.

const CLAVE_NUEVOS = 'productos-nuevos'
const CLAVE_EDICIONES = 'productos-ediciones'
const CLAVE_ELIMINADOS = 'productos-eliminados'

function leerJSON(clave, defecto) {
  try {
    const datos = JSON.parse(localStorage.getItem(clave))
    return datos ?? defecto
  } catch {
    return defecto
  }
}

function guardarJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}

function normalizar(texto) {
  return String(texto || '').trim().toLowerCase()
}

function prefijoDe(nombre) {
  const letras = String(nombre || '')
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
  return (letras.slice(0, 3) || 'EQP').padEnd(3, 'X')
}

// Carga inicial de lo guardado
const nuevosGuardados = leerJSON(CLAVE_NUEVOS, [])
if (Array.isArray(nuevosGuardados)) {
  nuevosGuardados.forEach(({ producto, detalle }) => {
    if (!PRODUCTOS.some((p) => p.id === producto.id)) {
      PRODUCTOS.push(producto)
      DETALLES[producto.id] = detalle
    }
  })
}

const edicionesGuardadas = leerJSON(CLAVE_EDICIONES, {})
Object.entries(edicionesGuardadas || {}).forEach(([id, { producto, detalle }]) => {
  const actual = PRODUCTOS.find((p) => p.id === Number(id))
  if (!actual) return
  Object.assign(actual, producto)
  DETALLES[id] = { ...(DETALLES[id] || { prefijo: 'EQP', inicio: 1 }), ...detalle }
})

const eliminadosGuardados = leerJSON(CLAVE_ELIMINADOS, [])
const eliminados = new Set(Array.isArray(eliminadosGuardados) ? eliminadosGuardados : [])
for (let i = PRODUCTOS.length - 1; i >= 0; i -= 1) {
  if (eliminados.has(PRODUCTOS[i].id)) PRODUCTOS.splice(i, 1)
}

// ¿Ya existe un equipo con esa marca y modelo?
export const MENSAJE_EQUIPO_DUPLICADO = 'Ya existe un equipo con esta marca y modelo.'

export function existeEquipo(marca, modelo, ignorarId = null) {
  const normalizarIdentificacion = (texto) => normalizar(texto).replace(/\s+/g, ' ')
  const marcaBuscada = normalizarIdentificacion(marca)
  const modeloBuscado = normalizarIdentificacion(modelo)
  if (!marcaBuscada || !modeloBuscado) return false

  return PRODUCTOS.some(
    (p) =>
      p.id !== Number(ignorarId) &&
      normalizarIdentificacion(p.marca) === marcaBuscada &&
      normalizarIdentificacion(p.modelo) === modeloBuscado
  )
}

// datos: { nombre, categoria, marca, modelo, descripcion, accesorios, fotos }
// Devuelve { ok: true, producto } o { ok: false, errores: { campo: mensaje } }
export function agregarProducto(datos) {
  if (existeEquipo(datos.marca, datos.modelo)) {
    return { ok: false, errores: { modelo: MENSAJE_EQUIPO_DUPLICADO } }
  }

  let nuevos
  let id
  const fallo = { ok: false, persistido: false, errores: { general: 'No se pudo guardar el equipo en este navegador.' } }
  try {
    nuevos = JSON.parse(localStorage.getItem(CLAVE_NUEVOS)) ?? []
    const bajas = JSON.parse(localStorage.getItem(CLAVE_ELIMINADOS)) ?? []
    if (!Array.isArray(nuevos) || !Array.isArray(bajas)) return fallo
    id = Math.max(0, ...PRODUCTOS.map((p) => p.id), ...nuevos.map((item) => item.producto.id), ...eliminados, ...bajas) + 1
    if (!Number.isSafeInteger(id)) return fallo
  } catch {
    return fallo
  }
  const producto = {
    id,
    codigo: `INV-${String(id).padStart(4, '0')}`,
    nombre: datos.nombre.trim(),
    marca: datos.marca.trim(),
    modelo: datos.modelo.trim(),
    categoria: datos.categoria,
    libres: 0,
    total: 0,
    duracionMax: 7,
    fotos: datos.fotos || []
  }
  const detalle = {
    prefijo: prefijoDe(datos.nombre),
    inicio: 1,
    descripcion: datos.descripcion || '',
    accesorios: datos.accesorios || [],
    autorizacion: false,
    estados: []
  }

  if (!guardarJSON(CLAVE_NUEVOS, [...nuevos, { producto, detalle }])) return fallo

  PRODUCTOS.push(producto)
  DETALLES[id] = detalle
  return { ok: true, producto, persistido: true }
}

// Actualiza un equipo existente (de ejemplo o creado antes)
export function actualizarProducto(id, datos) {
  const producto = PRODUCTOS.find((p) => p.id === Number(id))
  if (!producto) return { ok: false, errores: { general: 'No se encontró el equipo.' } }

  if (existeEquipo(datos.marca, datos.modelo, id)) {
    return { ok: false, errores: { modelo: MENSAJE_EQUIPO_DUPLICADO } }
  }

  const cambiosProducto = {
    nombre: datos.nombre.trim(),
    marca: datos.marca.trim(),
    modelo: datos.modelo.trim(),
    categoria: datos.categoria,
    fotos: datos.fotos || []
  }
  const cambiosDetalle = {
    descripcion: datos.descripcion || '',
    accesorios: datos.accesorios || []
  }

  const fallo = { ok: false, errores: { general: 'No se pudieron guardar los cambios en este navegador.' } }

  try {
    const bajas = JSON.parse(localStorage.getItem(CLAVE_ELIMINADOS)) ?? []
    const nuevos = JSON.parse(localStorage.getItem(CLAVE_NUEVOS)) ?? []
    if (!Array.isArray(bajas) || !Array.isArray(nuevos)) return fallo
    if (bajas.includes(producto.id)) return { ok: false, errores: { general: 'El equipo ya no está en el inventario.' } }

    const detalle = DETALLES[producto.id]
    if (detalle?.titulo === producto.nombre) cambiosDetalle.titulo = cambiosProducto.nombre

    const idx = nuevos.findIndex((n) => n.producto.id === producto.id)
    if (idx >= 0) {
      const registro = nuevos[idx]
      nuevos[idx] = {
        producto: { ...registro.producto, ...cambiosProducto },
        detalle: { ...registro.detalle, ...cambiosDetalle }
      }
      if (!guardarJSON(CLAVE_NUEVOS, nuevos)) return fallo
    } else {
      const ediciones = JSON.parse(localStorage.getItem(CLAVE_EDICIONES)) ?? {}
      if (typeof ediciones !== 'object' || Array.isArray(ediciones)) return fallo
      const registro = ediciones[producto.id]
      ediciones[producto.id] = {
        producto: { ...registro?.producto, ...cambiosProducto },
        detalle: { ...registro?.detalle, ...cambiosDetalle }
      }
      if (!guardarJSON(CLAVE_EDICIONES, ediciones)) return fallo
    }
  } catch {
    return fallo
  }

  Object.assign(producto, cambiosProducto)
  DETALLES[producto.id] = { ...DETALLES[producto.id], ...cambiosDetalle }
  return { ok: true, producto }
}

export function eliminarProducto(id) {
  const indice = PRODUCTOS.findIndex((p) => p.id === Number(id))
  if (indice === -1) return { ok: false, motivo: 'El equipo no existe.' }

  const producto = PRODUCTOS[indice]
  const leerRegistro = (clave) => JSON.parse(localStorage.getItem(clave))

  let idsEliminados
  try {
    const unidadesGuardadas = leerRegistro('producto-unidades')?.[producto.id] || []
    const estados = leerRegistro('inventario-estados') || {}
    const unidades = [...generarUnidades(producto, DETALLES[producto.id]), ...unidadesGuardadas]
    if (unidades.some((u) => (estados[u.codigo]?.estado || u.estado) === 'Prestada')) {
      return { ok: false, motivo: 'El equipo tiene unidades prestadas.' }
    }

    const haceReferencia = (registro) => {
      const idRegistro = registro.productoId ?? registro.equipoId
      return Number(idRegistro) === producto.id ||
        unidades.some((u) => u.codigo === registro.unidad) ||
        (idRegistro == null && normalizar(registro.equipo) === normalizar(producto.nombre))
    }

    const solicitudes = leerRegistro('solicitudes') ?? []
    if (solicitudes.some(haceReferencia)) {
      return { ok: false, motivo: 'El equipo tiene solicitudes asociadas.' }
    }

    const prestamos = leerRegistro('prestamos') ?? []
    const prestamosPorCuenta = leerRegistro('bdPrestamos') ?? {}
    if (prestamos.some(haceReferencia) || Object.values(prestamosPorCuenta).flat().some(haceReferencia)) {
      return { ok: false, motivo: 'El equipo figura en el historial de préstamos.' }
    }

    const reservas = leerRegistro('reservas') ?? []
    const reservasAnteriores = leerRegistro('calendario-reservas') ?? []
    if (reservas.some(haceReferencia) || reservasAnteriores.some(haceReferencia)) {
      return { ok: false, motivo: 'El equipo tiene reservas asociadas.' }
    }

    idsEliminados = new Set([...eliminados, ...(leerRegistro(CLAVE_ELIMINADOS) ?? []), producto.id])
  } catch {
    return { ok: false, motivo: 'No se pudieron verificar los datos del equipo.' }
  }

  if (!guardarJSON(CLAVE_ELIMINADOS, [...idsEliminados])) {
    return { ok: false, motivo: 'No se pudo guardar la eliminación.' }
  }

  idsEliminados.forEach((idEliminado) => eliminados.add(idEliminado))
  PRODUCTOS.splice(indice, 1)
  return { ok: true }
}

export function cambiarEstadoUnidad(codigoUnidad, estado, motivo) {
  if (!['Disponible', 'Prestada', 'Mantenimiento', 'De baja'].includes(estado)) {
    return { ok: false, motivo: 'estado-invalido' }
  }

  const fallo = { ok: false, motivo: 'almacenamiento' }
  try {
    const encontrada = PRODUCTOS.some((p) => obtenerProducto(p.id).unidades.some((u) => u.codigo === codigoUnidad))
    if (!encontrada) return { ok: false, motivo: 'unidad-inexistente' }
    const cambios = JSON.parse(localStorage.getItem('inventario-estados')) ?? {}
    if (typeof cambios !== 'object' || Array.isArray(cambios)) return fallo

    const cambio = { ...cambios[codigoUnidad], estado }
    if (typeof motivo === 'string') cambio.nota = motivo
    if (estado === 'De baja' && motivo) cambio.motivoBaja = motivo
    cambios[codigoUnidad] = cambio

    return guardarJSON('inventario-estados', cambios) ? { ok: true } : fallo
  } catch {
    return fallo
  }
}

export function registrarUnidadProducto(id, unidad) {
  const producto = PRODUCTOS.find((p) => p.id === Number(id))
  if (!producto) return { ok: false, motivo: 'equipo-inexistente' }

  const normalizarCodigo = (codigo) => String(codigo ?? '').replace(/\s+/g, '').toUpperCase()
  const codigo = normalizarCodigo(unidad?.codigo)
  const ubicacion = String(unidad?.ubicacion ?? '').trim()
  const observaciones = String(unidad?.observaciones ?? '').trim()
  if (!/^INV-[A-Z]{3}-\d{4}$/.test(codigo) || !ubicacion) return { ok: false, motivo: 'datos-invalidos' }

  const fallo = { ok: false, motivo: 'almacenamiento' }
  const clave = 'producto-unidades'
  try {
    const todas = JSON.parse(localStorage.getItem(clave)) ?? {}
    const estados = JSON.parse(localStorage.getItem('inventario-estados')) ?? {}
    const bajas = JSON.parse(localStorage.getItem(CLAVE_ELIMINADOS)) ?? []
    if (typeof todas !== 'object' || Array.isArray(todas) || !Object.values(todas).every(Array.isArray) ||
        typeof estados !== 'object' || Array.isArray(estados) || !Array.isArray(bajas)) return fallo
    if (bajas.includes(producto.id)) return { ok: false, motivo: 'equipo-inexistente' }

    const coincide = (u) => normalizarCodigo(u?.codigo) === codigo
    const enCatalogo = PRODUCTOS.some((p) => generarUnidades(p, DETALLES[p.id] || { prefijo: 'EQP', inicio: 1 }).some(coincide))
    const enAlmacenamiento = Object.values(todas).some((lista) => lista.some(coincide))
    const conEstadoGuardado = Object.keys(estados).some((claveEstado) => normalizarCodigo(claveEstado) === codigo)
    if (enCatalogo || enAlmacenamiento || conEstadoGuardado) return { ok: false, motivo: 'codigo-duplicado' }

    todas[producto.id] = [...(todas[producto.id] || []), { codigo, ubicacion, observaciones, estado: 'Disponible' }]
    return guardarJSON(clave, todas) ? { ok: true } : fallo
  } catch {
    return fallo
  }
}

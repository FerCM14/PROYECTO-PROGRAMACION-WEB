import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { transformSync } from 'rolldown/utils'

// Los imports del frontend sin extensión los resuelve Vite durante la compilación.
registerHooks({
  resolve(specifier, context, next) {
    const ruta = specifier.startsWith('./') && !/\.[a-z]+$/i.test(specifier) ? specifier + '.js' : specifier
    return next(ruta, context)
  }
})

const registros = new Map()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (clave) => registros.get(clave) ?? null,
    setItem: (clave, valor) => registros.set(clave, valor)
  }
})

const productos = await import('../src/data/Producto.js')
const prestamos = await import('../src/data/Identificacion.js')
const { disponibilidadEquipo, prestamosComprometidos, hayCupoEquipo } = await import('../src/data/CupoEquipo.js')
const { calcularEstados } = await import('../src/data/Reservas.js')
const { consultarReservasUnidad, cambiarEstadoUnidadManual } = await import('../src/data/EstadoUnidad.js')
const { consultarCupoSolicitud, proximoRangoConCupo } = await import('../src/data/Disponibilidad.js')
const { hoyISO, sumarDias } = await import('../src/data/fechas.js')
const guardar = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor))
const hoy = hoyISO()
let serie = 0

function crearEquipo(cantidad) {
  const resultado = productos.agregarProducto({
    nombre: 'Equipo de prueba', marca: 'Integración', modelo: `QA-${++serie}`, categoria: 'redes'
  })
  assert.ok(resultado.ok)
  const id = resultado.producto.id
  const codigos = Array.from({ length: cantidad }, (_, i) => `INV-QAT-${String(serie * 10 + i).padStart(4, '0')}`)
  for (const codigo of codigos) {
    assert.ok(productos.registrarUnidadProducto(id, { codigo, ubicacion: 'Almacén H-102' }).ok)
  }
  return { id, codigos, leer: () => productos.obtenerProducto(id) }
}

function reserva(id, indice) {
  return { id: `QA-${indice}`, productoId: id, desde: sumarDias(hoy, 3), hasta: sumarDias(hoy, 5), creadaEn: indice }
}

test('reservas por prioridad sobre las unidades reales y protección de compromisos', () => {
  const equipo = crearEquipo(3)
  const lista = [1, 2, 3, 4].map((i) => reserva(equipo.id, i))
  assert.deepEqual(lista.map((r) => calcularEstados(lista, hoy)[r.id].estado),
    ['Confirmada', 'Confirmada', 'Confirmada', 'En espera'])
  assert.ok(cambiarEstadoUnidadManual(equipo.codigos[2], 'De baja', 'Retiro de prueba').ok)
  assert.deepEqual(lista.map((r) => calcularEstados(lista, hoy)[r.id].estado),
    ['Confirmada', 'Confirmada', 'En espera', 'En espera'])
  guardar('reservas', lista)
  const antes = localStorage.getItem('reservas')
  assert.equal(consultarReservasUnidad(equipo.leer(), equipo.leer().unidades[0], hoy).porModelo.length, 1)
  assert.equal(cambiarEstadoUnidadManual(equipo.codigos[0], 'Mantenimiento', 'Prueba').ok, false)
  assert.equal(localStorage.getItem('reservas'), antes)
  guardar('reservas', [])
  assert.ok(cambiarEstadoUnidadManual(equipo.codigos[0], 'Mantenimiento', 'Prueba').ok)
  assert.equal(equipo.leer().total, 3)
  assert.equal(disponibilidadEquipo(equipo.leer()).activas.length, 2)
  assert.equal(disponibilidadEquipo(equipo.leer()).libres, 1)
  const vacio = crearEquipo(0)
  assert.equal(calcularEstados([reserva(vacio.id, 8)], hoy)['QA-8'].estado, 'En espera')
})

test('solicitud por fechas, préstamo pendiente, fecha pactada y continuidad de unidad', () => {
  const equipo = crearEquipo(2)
  const [a, b] = equipo.codigos
  const pendiente = { unidad: a, productoId: equipo.id, estado: 'Pendiente de entrega', desde: hoy, hasta: sumarDias(hoy, 2) }
  const entregado = { unidad: b, productoId: equipo.id, estado: 'Entregado', desde: hoy, hasta: sumarDias(hoy, 2) }
  guardar('prestamos', [pendiente, entregado])
  assert.ok(productos.cambiarEstadoUnidad(b, 'Prestada').ok)
  assert.equal(disponibilidadEquipo(equipo.leer()).libres, 0)
  assert.equal(cambiarEstadoUnidadManual(a, 'De baja', 'Prueba').ok, false)
  assert.equal(consultarCupoSolicitud(equipo.id, hoy)(hoy, sumarDias(hoy, 1)), false)
  assert.ok(consultarCupoSolicitud(equipo.id, hoy)(sumarDias(hoy, 3), sumarDias(hoy, 4)))
  assert.equal(proximoRangoConCupo(() => false, hoy), null)
  guardar('prestamos', [
    pendiente,
    { ...entregado, estado: 'Pendiente de entrega', desde: sumarDias(hoy, 3), hasta: sumarDias(hoy, 5) }
  ])
  assert.ok(productos.cambiarEstadoUnidad(b, 'Disponible').ok)
  assert.equal(hayCupoEquipo(equipo.leer(), prestamosComprometidos(equipo.leer()), [], hoy, sumarDias(hoy, 5), hoy), false)
  guardar('prestamos', [])
})

test('penalidades cero y personalizadas, renovación y lectura tras recarga', async () => {
  const si = crearEquipo(1)
  const no = crearEquipo(1)
  const condiciones = { dias: 6, requiereAutorizacion: true, admiteRenovacion: true, penalizacion: 12.5 }
  assert.ok(productos.guardarCondicionesProducto(si.id, condiciones).ok)
  assert.ok(productos.guardarCondicionesProducto(no.id, { ...condiciones, requiereAutorizacion: false, admiteRenovacion: false, penalizacion: 0 }).ok)
  const vigente = { codigo: 'REN-SI', productoId: si.id, unidad: si.codigos[0], estado: 'Entregado', desde: hoy, hasta: sumarDias(hoy, 2) }
  const historico = { ...vigente, codigo: 'HIST', estado: 'Devuelto', devolucion: { penalidad: 15 } }
  guardar('prestamos', [vigente, historico, { ...vigente, codigo: 'REN-NO', productoId: no.id }])
  assert.ok(prestamos.renovarPrestamo('REN-SI', sumarDias(hoy, 4)).ok)
  assert.equal(prestamos.renovarPrestamo('REN-NO', sumarDias(hoy, 4)).ok, false)
  assert.equal(prestamos.renovarPrestamo('REN-SI', sumarDias(hoy, 9)).ok, false)
  assert.equal(prestamos.renovarPrestamo('REN-SI', 'inválida').ok, false)
  assert.match(prestamos.errorRenovacionPrestamo(vigente, sumarDias(hoy, 4), sumarDias(hoy, 3)), /venció/)
  assert.deepEqual(prestamos.obtenerPrestamo('HIST'), historico)
  const recarga = await import('../src/data/Producto.js?recarga')
  assert.equal(recarga.obtenerProducto(si.id).penalizacion, 12.5)
  assert.equal(recarga.obtenerProducto(no.id).penalizacion, 0)
  assert.equal(recarga.obtenerProducto(si.id).autorizacion, true)
  assert.equal(recarga.obtenerProducto(no.id).autorizacion, false)
})

test('retorno después del login restringido a fichas internas vigentes', () => {
  const source = readFileSync(new URL('../src/components/visitante/LoginPage.jsx', import.meta.url), 'utf8')
  const { code } = transformSync('LoginPage.jsx', source, { jsx: { runtime: 'classic' } })
  const cuerpo = code.replace(/^import .*$/gm, '').replace(/^export default .*$/gm, '')
  const destino = new Function('obtenerProducto', cuerpo + '\nreturn destinoTrasLogin')(productos.obtenerProducto)
  const equipo = crearEquipo(0)
  assert.equal(destino('estudiante', `/equipo/${equipo.id}`), `/catalogo/${equipo.id}`)
  assert.equal(destino('encargado', `/equipo/${equipo.id}`), '/encargado/inventario')
  assert.equal(destino('estudiante', 'https://externo.test/equipo/1'), '/cuenta')
  assert.equal(destino('estudiante', '//externo.test/equipo/1'), '/cuenta')
  assert.ok(productos.eliminarProducto(equipo.id).ok)
  assert.equal(destino('estudiante', `/equipo/${equipo.id}`), '/cuenta')
})

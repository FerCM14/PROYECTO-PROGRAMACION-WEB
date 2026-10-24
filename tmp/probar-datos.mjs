import vm from 'node:vm'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const values = new Map()
const localStorage = {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}
const context=vm.createContext({localStorage,console,Date,Event,window:{dispatchEvent(){}},setInterval,clearInterval})
const cache=new Map()
async function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});cache.set(file,m);await m.link((s,ref)=>load(path.resolve(path.dirname(ref.identifier),s+'.js')));return m}
async function api(name){const m=await load('src/data/'+name+'.js');if(m.status!=='evaluated')await m.evaluate();return m.namespace}
const cuentas=await api('cuentas'), solicitudes=await api('Solicitudes'), loans=await api('Identificacion'), inv=await api('Inventario'), ranking=await api('Ranking'), metrics=await api('Metricas'), reservas=await api('Reservas'), encargados=await api('Encargadosstorage')
assert.equal(reservas.obtenerTodasLasReservas().length,0)
assert.equal(inv.contarUnidades(),74)
const email='20260001@aloe.ulima.edu.pe'
assert.equal(cuentas.registrarCuenta({nombres:'Ana',apellidos:'Pérez',carrera:'Ingeniería de Sistemas',ciclo:'5',correo:email,contrasena:'prueba'}).ok,true)
const today=new Date().toISOString().slice(0,10)
const {solicitud:s}=solicitudes.registrarSolicitud(email,{equipoId:1,equipo:'Kit de robótica Arduino Mega',inicio:today,devolucion:today})
assert.equal(s.productoId,1);assert.equal(s.hasta,today)
const {prestamo:p}=loans.crearPrestamo({solicitud:s.codigo,correo:email,productoId:1,equipo:s.equipo,unidad:'INV-ARD-0010',desde:today,hasta:'2020-01-01'})
assert.equal(loans.registrarEntrega(p.codigo,{fechaEntrega:today,accesorios:[]}).ok,true)
assert.equal(inv.obtenerInventario()[0].unidades[0].estado,'Prestada')
assert.equal(cuentas.bloquearCuenta(email,'Prueba').motivo,'prestamo-pendiente')
assert.equal(cuentas.obtenerCuenta(email).bloqueada,false)
let r=ranking.calcularRanking({desde:'2020-01-01',hasta:'2099-12-31'})
assert.equal(r.mas[0].prestamos,1);assert.ok(Math.abs(r.mas[0].porcentaje-100/6)<0.0001);assert.equal(r.carreras[0].total,1)
let m=metrics.calcularMetricas({desde:'2020-01-01',hasta:'2099-12-31'})
assert.equal(m.periodo,1);assert.equal(m.total,74);assert.equal(m.vencidos,1)
assert.equal(loans.registrarDevolucion(p.codigo,{fechaRetorno:today,diasRetraso:2}).ok,true)
cuentas.asignarDeuda(email,{monto:30})
let user=ranking.usuariosConResumen()[0];assert.equal(user.retrasos,1);assert.equal(user.monto,15)
const {reserva}=reservas.registrarReserva({correo:email,productoId:1,desde:today,hasta:'2099-01-01'})
assert.equal(cuentas.bloquearCuenta(email,'Penalidad','Detalle').ok,true)
assert.equal(reservas.obtenerTodasLasReservas().some(r=>r.id===reserva.id),false)
assert.equal(cuentas.iniciarSesion(email,'prueba').motivo,'bloqueada')
assert.equal(cuentas.obtenerCuenta(email).historial[0].motivo,'Penalidad')
assert.equal(cuentas.obtenerCuenta(email).notificaciones.length,1)
cuentas.desbloquearCuenta(email);assert.equal(cuentas.iniciarSesion(email,'prueba').ok,true);assert.equal(ranking.usuariosConResumen()[0].estado,'Habilitado')
encargados.registrarEncargado({nombres:'Elena',apellidos:'Rivas',correo:'encargada@aloe.ulima.edu.pe',contrasena:'prueba',almacen:'Almacén H-102',anexo:'102'})
assert.equal(cuentas.iniciarSesion('encargada@aloe.ulima.edu.pe','prueba').cuenta.rol,'encargado')
assert.equal(cuentas.obtenerSesion().almacen,'Almacén H-102')
console.log('PASS: inventario, solicitud, entrega, métricas, ranking, devoluciones, bloqueo, cancelación de reservas, historial, desbloqueo e ingreso de encargado.')



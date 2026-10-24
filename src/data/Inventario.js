import { PRODUCTOS, obtenerProducto } from './Producto'

export function obtenerInventario() {
  let cambios = {}
  try { cambios = JSON.parse(localStorage.getItem('inventario-estados')) || {} } catch { /* sin cambios */ }
  return PRODUCTOS.map((p) => {
    const producto = obtenerProducto(p.id)
    return { ...producto, unidades: producto.unidades.map((u) => ({
      ...u, ...cambios[u.codigo]
    })) }
  })
}

export function contarUnidades() {
  return obtenerInventario().reduce((total, p) => total + p.unidades.length, 0)
}

export function imagenEquipo(producto) {
  return producto.fotos?.[0] || producto.imagen || `/imagenes/${['robotica', 'medicion', 'audiovisual', 'computo', 'redes', 'fisica'].includes(producto.categoria) ? producto.categoria : 'medicion'}.svg`
}

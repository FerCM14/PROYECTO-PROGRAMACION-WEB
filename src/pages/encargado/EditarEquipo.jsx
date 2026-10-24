import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import HeaderEncargado from '../../components/Header/Header-Encargado'
import FooterEncargado from '../../components/Footer/Footer-Encargado'
import Operacion from '../../components/Extra/Operacion'

import {
  CATEGORIAS,
  PRODUCTOS,
  obtenerProducto,
  agregarProducto,
  actualizarProducto
} from '../../data/Producto'
import './EditarEquipo.css'

const RUTA_INVENTARIO = '/encargado/inventario'
const CLAVE_BORRADOR = 'equipo-borrador'
const MAX_DESCRIPCION = 400
const MAX_FOTOS = 4
const LADO_FOTO = 600

const VACIO = {
  nombre: '',
  categoria: '',
  marca: '',
  modelo: '',
  descripcion: '',
  accesorios: [],
  fotos: []
}

function leerBorrador() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_BORRADOR))
    return datos && typeof datos === 'object' ? { ...VACIO, ...datos } : VACIO
  } catch {
    return VACIO
  }
}

// Lee una imagen del equipo del usuario, la recorta cuadrada y la reduce
// para que ocupe poco en el almacenamiento del navegador.
function procesarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('lectura'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('imagen'))
      img.onload = () => {
        const lado = Math.min(img.width, img.height)
        const sx = (img.width - lado) / 2
        const sy = (img.height - lado) / 2
        const salida = Math.min(LADO_FOTO, lado)
        const canvas = document.createElement('canvas')
        canvas.width = salida
        canvas.height = salida
        canvas.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, salida, salida)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = lector.result
    }
    lector.readAsDataURL(archivo)
  })
}

export default function EditarEquipo() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const idEditar = params.get('id')

  const existente = useMemo(() => (idEditar ? obtenerProducto(idEditar) : null), [idEditar])
  const editando = Boolean(existente)

  const [form, setForm] = useState(() =>
    existente
      ? {
          nombre: existente.nombre,
          categoria: existente.categoria,
          marca: existente.marca,
          modelo: existente.modelo,
          descripcion: existente.descripcion || '',
          accesorios: [...(existente.accesorios || [])],
          fotos: [...(existente.fotos || [])]
        }
      : leerBorrador()
  )
  const [errores, setErrores] = useState({})
  const [mensajeFotos, setMensajeFotos] = useState('')
  const [avisoBorrador, setAvisoBorrador] = useState('')
  const [nuevoAccesorio, setNuevoAccesorio] = useState('')
  const [arrastrando, setArrastrando] = useState(false)
  const inputFotos = useRef(null)

  const totalUnidades = PRODUCTOS.reduce((suma, p) => suma + (obtenerProducto(p.id)?.unidades.length || 0), 0)
  const cantErrores = Object.keys(errores).length

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
    setAvisoBorrador('')
  }

  /* ---------- Accesorios ---------- */

  function agregarAccesorio() {
    const texto = nuevoAccesorio.trim()
    if (!texto) return
    setForm((f) => ({ ...f, accesorios: [...f.accesorios, texto] }))
    setNuevoAccesorio('')
  }

  function quitarAccesorio(indice) {
    setForm((f) => ({ ...f, accesorios: f.accesorios.filter((_, i) => i !== indice) }))
  }

  /* ---------- Fotografías desde el equipo del usuario ---------- */

  async function recibirArchivos(lista) {
    const archivos = Array.from(lista || [])
    if (!archivos.length) return

    const validos = archivos.filter((a) => ['image/jpeg', 'image/png'].includes(a.type))
    const descartados = archivos.length - validos.length
    const cupo = MAX_FOTOS - form.fotos.length

    let mensaje = ''
    if (descartados) mensaje = 'Solo se aceptan archivos JPG o PNG.'
    if (validos.length > cupo) mensaje = `Máximo ${MAX_FOTOS} fotografías por equipo.`
    setMensajeFotos(mensaje)

    const aceptados = validos.slice(0, Math.max(0, cupo))
    try {
      const imagenes = await Promise.all(aceptados.map(procesarImagen))
      setForm((f) => ({ ...f, fotos: [...f.fotos, ...imagenes].slice(0, MAX_FOTOS) }))
    } catch {
      setMensajeFotos('No se pudo leer una de las imágenes. Prueba con otra.')
    }
  }

  function alElegir(e) {
    recibirArchivos(e.target.files)
    e.target.value = ''
  }

  function alSoltar(e) {
    e.preventDefault()
    setArrastrando(false)
    recibirArchivos(e.dataTransfer.files)
  }

  function quitarFoto(indice) {
    setForm((f) => ({ ...f, fotos: f.fotos.filter((_, i) => i !== indice) }))
    setMensajeFotos('')
  }

  /* ---------- Guardar ---------- */

  function validar() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (!form.categoria) e.categoria = 'Elige una categoría.'
    if (!form.marca.trim()) e.marca = 'La marca es obligatoria.'
    if (!form.modelo.trim()) e.modelo = 'El modelo es obligatorio.'
    return e
  }

  function guardarEquipo(evento) {
    evento.preventDefault()

    const e = validar()
    if (Object.keys(e).length) {
      setErrores(e)
      return
    }

    const resultado = editando ? actualizarProducto(idEditar, form) : agregarProducto(form)

    if (!resultado.ok) {
      setErrores(resultado.errores || {})
      return
    }

    if (!editando) {
      try {
        localStorage.removeItem(CLAVE_BORRADOR)
      } catch {
        /* sin almacenamiento */
      }
    }
    navigate(RUTA_INVENTARIO)
  }

  function guardarBorrador() {
    try {
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(form))
      setAvisoBorrador('Borrador guardado en este navegador.')
    } catch {
      setAvisoBorrador('No se pudo guardar el borrador.')
    }
  }

  const campoClase = (campo) => `eq-input ${errores[campo] ? 'eq-input--error' : ''}`

  return (
    <div className="eq-pagina">
      <HeaderEncargado />

      <div className="eq-cuerpo">
        <aside className="eq-lateral">
          <Operacion activo="inventario" totalInventario={totalUnidades} />
        </aside>

        <main className="eq-contenido">
          <p className="eq-migas">
            <Link to={RUTA_INVENTARIO}>Inventario</Link> / {editando ? 'Editar equipo' : 'Nuevo equipo'}
          </p>
          <h1 className="eq-titulo">{editando ? 'Editar equipo' : 'Nuevo equipo'}</h1>

          <form className="eq-form" onSubmit={guardarEquipo} noValidate>
            <div className="eq-columna">
              {/* ---------- Identificación ---------- */}
              <section className="eq-tarjeta">
                <h2 className="eq-seccion">Identificación</h2>

                <div className="eq-fila eq-fila--nombre">
                  <div className="eq-campo">
                    <label className="eq-label" htmlFor="eq-nombre">Nombre del equipo</label>
                    <input
                      id="eq-nombre"
                      className={campoClase('nombre')}
                      value={form.nombre}
                      onChange={(e) => cambiar('nombre', e.target.value)}
                      aria-invalid={Boolean(errores.nombre)}
                    />
                    {errores.nombre && <p className="eq-error">{errores.nombre}</p>}
                  </div>

                  <div className="eq-campo">
                    <label className="eq-label" htmlFor="eq-categoria">Categoría</label>
                    <select
                      id="eq-categoria"
                      className={campoClase('categoria')}
                      value={form.categoria}
                      onChange={(e) => cambiar('categoria', e.target.value)}
                      aria-invalid={Boolean(errores.categoria)}
                    >
                      <option value="" disabled>Selecciona…</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    {errores.categoria && <p className="eq-error">{errores.categoria}</p>}
                  </div>
                </div>

                <div className="eq-fila">
                  <div className="eq-campo">
                    <label className="eq-label" htmlFor="eq-marca">Marca</label>
                    <input
                      id="eq-marca"
                      className={campoClase('marca')}
                      value={form.marca}
                      onChange={(e) => cambiar('marca', e.target.value)}
                      aria-invalid={Boolean(errores.marca)}
                    />
                    {errores.marca && <p className="eq-error">{errores.marca}</p>}
                  </div>

                  <div className="eq-campo">
                    <label className="eq-label" htmlFor="eq-modelo">Modelo</label>
                    <input
                      id="eq-modelo"
                      className={`${campoClase('modelo')} eq-input--mono`}
                      value={form.modelo}
                      onChange={(e) => cambiar('modelo', e.target.value)}
                      aria-invalid={Boolean(errores.modelo)}
                    />
                    {errores.modelo && <p className="eq-error">{errores.modelo}</p>}
                  </div>
                </div>

                {/* ---------- Descripción ---------- */}
                <h2 className="eq-seccion eq-seccion--sep">Descripción</h2>
                <textarea
                  className="eq-input eq-textarea"
                  rows={4}
                  maxLength={MAX_DESCRIPCION}
                  value={form.descripcion}
                  onChange={(e) => cambiar('descripcion', e.target.value)}
                  aria-label="Descripción"
                />
                <p className="eq-ayuda">
                  Máximo {MAX_DESCRIPCION} caracteres. Se muestra en la ficha pública del catálogo.
                  <span className="eq-contador"> {form.descripcion.length}/{MAX_DESCRIPCION}</span>
                </p>

                {/* ---------- Accesorios ---------- */}
                <h2 className="eq-seccion eq-seccion--sep">Accesorios incluidos</h2>
                <ul className="eq-accesorios">
                  {form.accesorios.map((a, i) => (
                    <li key={`${a}-${i}`} className="eq-accesorio">
                      <span>{a}</span>
                      <button type="button" className="eq-quitar" onClick={() => quitarAccesorio(i)}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="eq-agregar">
                  <input
                    className="eq-input"
                    placeholder="Nombre del accesorio"
                    value={nuevoAccesorio}
                    onChange={(e) => setNuevoAccesorio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        agregarAccesorio()
                      }
                    }}
                    aria-label="Nombre del accesorio"
                  />
                  <button type="button" className="eq-btn eq-btn--sec" onClick={agregarAccesorio}>
                    Agregar
                  </button>
                </div>
              </section>
            </div>

            <div className="eq-columna eq-columna--lateral">
              {/* ---------- Fotografías ---------- */}
              <section className="eq-tarjeta">
                <h2 className="eq-seccion">Fotografías</h2>

                <div className="eq-fotos">
                  <div className="eq-fotos__slots">
                    {Array.from({ length: Math.max(2, Math.min(MAX_FOTOS, form.fotos.length + 1)) }, (_, i) => {
                      const foto = form.fotos[i]
                      return foto ? (
                        <div key={i} className="eq-slot eq-slot--llena">
                          <img src={foto} alt={`Fotografía ${i + 1} del equipo`} />
                          {i === 0 && <span className="eq-slot__principal">principal</span>}
                          <button
                            type="button"
                            className="eq-slot__quitar"
                            onClick={() => quitarFoto(i)}
                            aria-label={`Quitar fotografía ${i + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          className="eq-slot eq-slot--vacia"
                          onClick={() => inputFotos.current?.click()}
                          aria-label="Agregar fotografía"
                        >
                          {i === 0 && <span className="eq-slot__principal">principal</span>}
                        </button>
                      )
                    })}
                  </div>

                  <div
                    className={`eq-soltar ${arrastrando ? 'is-arrastrando' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setArrastrando(true)
                    }}
                    onDragLeave={() => setArrastrando(false)}
                    onDrop={alSoltar}
                  >
                    <p>Arrastra las fotografías</p>
                    <p className="eq-soltar__sub">JPG o PNG · encuadre cuadrado</p>
                    <button
                      type="button"
                      className="eq-btn eq-btn--sec eq-btn--chico"
                      onClick={() => inputFotos.current?.click()}
                      disabled={form.fotos.length >= MAX_FOTOS}
                    >
                      Elegir desde tu equipo
                    </button>
                  </div>
                </div>

                <input
                  ref={inputFotos}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={alElegir}
                />
                {mensajeFotos && <p className="eq-error">{mensajeFotos}</p>}
              </section>

              {/* Solo aparece cuando falla la validación */}
              {cantErrores > 0 && (
                <section className="eq-tarjeta eq-tarjeta--errores" role="alert">
                  <h2 className="eq-seccion">Estado del formulario · con errores</h2>
                  <p className="eq-banner">
                    No se pudo guardar. Revisa {cantErrores} {cantErrores === 1 ? 'campo marcado' : 'campos marcados'}.
                  </p>
                </section>
              )}

              <div className="eq-acciones">
                <Link to={RUTA_INVENTARIO} className="eq-cancelar">Cancelar</Link>
                {!editando && (
                  <button type="button" className="eq-btn eq-btn--sec" onClick={guardarBorrador}>
                    Guardar borrador
                  </button>
                )}
                <button type="submit" className="eq-btn eq-btn--pri">Guardar equipo</button>
              </div>
              {avisoBorrador && <p className="eq-ayuda eq-ayuda--der">{avisoBorrador}</p>}
            </div>
          </form>
        </main>
      </div>

      <FooterEncargado />
    </div>
  )
}
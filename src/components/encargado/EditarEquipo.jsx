import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import HeaderEncargado from '../Header/Header-Encargado'
import FooterEncargado from '../Footer/Footer-Encargado'
import Operacion from '../Extra/Operacion'

import { useCatalogo } from '../../context/catalogo/CatalogoContext'
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
        try {
          if (!salida) throw new Error('imagen vacía')
          canvas.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, salida, salida)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        } catch (error) {
          reject(error)
        }
      }
      img.src = lector.result
    }
    lector.readAsDataURL(archivo)
  })
}

export default function EditarEquipo() {
  const { obtenerProducto } = useCatalogo()
  const [params] = useSearchParams()
  const idEditar = params.get('id')
  const existente = idEditar === null ? null : obtenerProducto(idEditar)

  if (idEditar !== null && !existente) {
    return (
      <div className="eq-pagina">
        <HeaderEncargado />
        <main className="eq-contenido">
          <h1 className="eq-titulo">Equipo no encontrado</h1>
          <Link to={RUTA_INVENTARIO}>Volver al inventario</Link>
        </main>
        <FooterEncargado />
      </div>
    )
  }

  return <FormularioEquipo key={existente?.id ?? 'nuevo'} existente={existente} />
}

function FormularioEquipo({ existente }) {
  const { CATEGORIAS,
  PRODUCTOS,
  obtenerProducto,
  existeEquipo,
  agregarProducto,
  actualizarProducto } = useCatalogo()
  const navigate = useNavigate()
  const idEditar = existente?.id
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
  const [errorAccesorio, setErrorAccesorio] = useState('')
  const [arrastrando, setArrastrando] = useState(false)
  const [procesandoFotos, setProcesandoFotos] = useState(false)
  const inputFotos = useRef(null)
  const lecturaEnCurso = useRef(false)

  const totalUnidades = PRODUCTOS.reduce((suma, p) => suma + (obtenerProducto(p.id)?.unidades.length || 0), 0)
  const cantErrores = Object.keys(errores).length

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
    setAvisoBorrador('')
  }

  /* ---------- Accesorios ---------- */

  function agregarAccesorio() {
    const texto = nuevoAccesorio.trim().replace(/\s+/g, ' ')
    if (!texto) {
      setErrorAccesorio('Escribe el nombre del accesorio.')
      return
    }
    if (form.accesorios.some((a) => a.trim().replace(/\s+/g, ' ').toLowerCase() === texto.toLowerCase())) {
      setErrorAccesorio('Ese accesorio ya está en la lista.')
      return
    }
    setForm((f) => ({ ...f, accesorios: [...f.accesorios, texto] }))
    setNuevoAccesorio('')
    setErrorAccesorio('')
  }

  function quitarAccesorio(indice) {
    setForm((f) => ({ ...f, accesorios: f.accesorios.filter((_, i) => i !== indice) }))
    setErrorAccesorio('')
  }

  /* ---------- Fotografías desde el equipo del usuario ---------- */

  async function recibirArchivos(lista) {
    const archivos = Array.from(lista || [])
    if (!archivos.length || lecturaEnCurso.current) return

    const validos = archivos.filter((a) =>
      /\.(jpe?g|png)$/i.test(a.name) && (!a.type || ['image/jpeg', 'image/png'].includes(a.type))
    )
    const cupo = Math.max(0, MAX_FOTOS - form.fotos.length)
    const mensajes = []
    if (validos.length !== archivos.length) mensajes.push('Solo se aceptan archivos JPG, JPEG o PNG.')
    if (validos.length > cupo) mensajes.push(`Máximo ${MAX_FOTOS} fotografías por equipo.`)

    const aceptados = validos.slice(0, cupo)
    setMensajeFotos(mensajes.join(' '))
    if (!aceptados.length) return

    lecturaEnCurso.current = true
    setProcesandoFotos(true)
    const resultados = await Promise.allSettled(aceptados.map(procesarImagen))
    const imagenes = resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    if (imagenes.length) {
      setForm((f) => ({ ...f, fotos: [...f.fotos, ...imagenes].slice(0, MAX_FOTOS) }))
    }
    if (imagenes.length !== aceptados.length) mensajes.push('No se pudieron leer algunas fotografías.')
    setMensajeFotos(mensajes.join(' '))
    lecturaEnCurso.current = false
    setProcesandoFotos(false)
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

  function validar(datos) {
    const e = {}
    if (!datos.nombre) e.nombre = 'El nombre es obligatorio.'
    if (!CATEGORIAS.some((c) => c.id === datos.categoria)) e.categoria = 'Elige una categoría de la lista.'
    if (!datos.marca) e.marca = 'La marca es obligatoria.'
    if (!datos.modelo) e.modelo = 'El modelo es obligatorio.'
    if (datos.descripcion.length > MAX_DESCRIPCION) {
      e.descripcion = `La descripción debe tener como máximo ${MAX_DESCRIPCION} caracteres.`
    }
    if (datos.marca && datos.modelo && existeEquipo(datos.marca, datos.modelo, idEditar)) {
      e.modelo = 'Ya existe un equipo con esta marca y modelo.'
    }
    return e
  }

  function guardarEquipo(evento) {
    evento.preventDefault()
    if (lecturaEnCurso.current) return

    const datos = {
      ...form,
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim()
    }
    const e = validar(datos)
    if (Object.keys(e).length) {
      setErrores(e)
      return
    }

    const resultado = editando ? actualizarProducto(idEditar, datos) : agregarProducto(datos)

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
    if (lecturaEnCurso.current) return
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
                      aria-describedby={errores.nombre ? 'eq-error-nombre' : undefined}
                      required
                    />
                    {errores.nombre && <p id="eq-error-nombre" className="eq-error">{errores.nombre}</p>}
                  </div>

                  <div className="eq-campo">
                    <label className="eq-label" htmlFor="eq-categoria">Categoría</label>
                    <select
                      id="eq-categoria"
                      className={campoClase('categoria')}
                      value={form.categoria}
                      onChange={(e) => cambiar('categoria', e.target.value)}
                      aria-invalid={Boolean(errores.categoria)}
                      aria-describedby={errores.categoria ? 'eq-error-categoria' : undefined}
                      required
                    >
                      <option value="" disabled>Selecciona…</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    {errores.categoria && <p id="eq-error-categoria" className="eq-error">{errores.categoria}</p>}
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
                      aria-describedby={errores.marca ? 'eq-error-marca' : undefined}
                      required
                    />
                    {errores.marca && <p id="eq-error-marca" className="eq-error">{errores.marca}</p>}
                  </div>

                  <div className="eq-campo">
                    <label className="eq-label" htmlFor="eq-modelo">Modelo</label>
                    <input
                      id="eq-modelo"
                      className={`${campoClase('modelo')} eq-input--mono`}
                      value={form.modelo}
                      onChange={(e) => cambiar('modelo', e.target.value)}
                      aria-invalid={Boolean(errores.modelo)}
                      aria-describedby={errores.modelo ? 'eq-error-modelo' : undefined}
                      required
                    />
                    {errores.modelo && <p id="eq-error-modelo" className="eq-error">{errores.modelo}</p>}
                  </div>
                </div>

                {/* ---------- Descripción ---------- */}
                <h2 className="eq-seccion eq-seccion--sep"><label htmlFor="eq-descripcion">Descripción</label></h2>
                <textarea
                  id="eq-descripcion"
                  className={`${campoClase('descripcion')} eq-textarea`}
                  rows={4}
                  maxLength={MAX_DESCRIPCION}
                  value={form.descripcion}
                  onChange={(e) => cambiar('descripcion', e.target.value)}
                  aria-invalid={Boolean(errores.descripcion)}
                  aria-describedby={errores.descripcion ? 'eq-ayuda-descripcion eq-error-descripcion' : 'eq-ayuda-descripcion'}
                />
                <p className="eq-ayuda eq-ayuda--descripcion" id="eq-ayuda-descripcion">
                  Máximo {MAX_DESCRIPCION} caracteres. Se muestra en la ficha pública del catálogo.
                  <span className={`eq-contador ${form.descripcion.length > MAX_DESCRIPCION ? 'eq-contador--exceso' : ''}`}>{form.descripcion.length}/{MAX_DESCRIPCION}</span>
                </p>
                {errores.descripcion && <p id="eq-error-descripcion" className="eq-error">{errores.descripcion}</p>}

                {/* ---------- Accesorios ---------- */}
                <h2 className="eq-seccion eq-seccion--sep">Accesorios incluidos</h2>
                {!form.accesorios.length && <p className="eq-ayuda">Sin accesorios registrados.</p>}
                <ul className="eq-accesorios">
                  {form.accesorios.map((a, i) => (
                    <li key={`${a}-${i}`} className="eq-accesorio">
                      <span>{a}</span>
                      <button type="button" className="eq-quitar" aria-label={`Quitar ${a}`} onClick={() => quitarAccesorio(i)}>
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
                    onChange={(e) => {
                      setNuevoAccesorio(e.target.value)
                      setErrorAccesorio('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        agregarAccesorio()
                      }
                    }}
                    aria-label="Nombre del accesorio"
                    aria-invalid={Boolean(errorAccesorio)}
                    aria-describedby={errorAccesorio ? 'eq-error-accesorio' : undefined}
                  />
                  <button type="button" className="eq-btn eq-btn--sec" onClick={agregarAccesorio}>
                    Agregar
                  </button>
                </div>
                {errorAccesorio && <p id="eq-error-accesorio" className="eq-error">{errorAccesorio}</p>}
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
                          disabled={procesandoFotos}
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
                      disabled={procesandoFotos || form.fotos.length >= MAX_FOTOS}
                    >
                      Elegir desde tu equipo
                    </button>
                  </div>
                </div>

                <input
                  ref={inputFotos}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={alElegir}
                />
                {procesandoFotos && <p className="eq-ayuda" role="status">Procesando fotografías…</p>}
                {mensajeFotos && <p className="eq-error" role="alert">{mensajeFotos}</p>}
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
                  <button type="button" className="eq-btn eq-btn--sec" onClick={guardarBorrador} disabled={procesandoFotos}>
                    Guardar borrador
                  </button>
                )}
                <button type="submit" className="eq-btn eq-btn--pri" disabled={procesandoFotos}>Guardar equipo</button>
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

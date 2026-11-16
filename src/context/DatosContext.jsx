/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

const DatosContext = createContext(0)

// También detecta escrituras de las páginas antiguas en la misma pestaña.
export function DatosProvider({ children }) {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let anterior = JSON.stringify(localStorage)
    const revisar = () => {
      const actual = JSON.stringify(localStorage)
      if (actual !== anterior) { anterior = actual; setVersion((v) => v + 1) }
    }
    const reloj = setInterval(revisar, 750)
    window.addEventListener('storage', revisar)
    window.addEventListener('focus', revisar)
    return () => { clearInterval(reloj); window.removeEventListener('storage', revisar); window.removeEventListener('focus', revisar) }
  }, [])
  return <DatosContext.Provider value={version}>{children}</DatosContext.Provider>
}

export const useActualizacion = () => useContext(DatosContext)

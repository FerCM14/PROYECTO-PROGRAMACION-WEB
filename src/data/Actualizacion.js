import { useEffect, useState } from 'react'

// También detecta escrituras de las páginas antiguas en la misma pestaña.
export function useActualizacion() {
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
  return version
}

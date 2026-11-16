# Préstamos de equipos de laboratorio

Aplicación React con Vite para visitantes, estudiantes y encargados.

## Ejecución

```sh
npm install
npm run dev
```

`npm run build` genera la aplicación en `dist`.

## Organización

- `src/main.jsx`: rutas y proveedores de contexto.
- `src/pages`: páginas de las rutas. Componen las vistas de `components`, siguiendo los ejemplos de clase.
- `src/components`: vistas y estilos organizados por rol, además de encabezados, pies de página y navegación compartida.
- `src/context/AuthContext.jsx`: estado de sesión, inicio y cierre de sesión mediante `useAuth`.
- `src/context/DatosContext.jsx`: actualización compartida de datos mediante `useActualizacion`.
- `src/data`: datos iniciales y operaciones de persistencia y reglas de préstamos existentes.
- `src/assets` y `public`: recursos gráficos.
- `tmp`: respaldos y herramientas auxiliares anteriores; no forman parte de la aplicación.

Las páginas delegan la interfaz a componentes, y los proveedores envuelven el router como en las guías de React. Se conserva la persistencia en localStorage. El contexto de datos mantiene la detección de cambios de las operaciones existentes para conservar su sincronización; el almacenamiento no es un servidor ni una base de datos compartida entre usuarios.

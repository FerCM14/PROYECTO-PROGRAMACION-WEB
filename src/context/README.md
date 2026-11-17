# Contextos por historias de usuario

Se agrupan por flujo funcional porque no se recibieron códigos oficiales de historias de usuario.

| Carpeta | Historias | Hook |
| --- | --- | --- |
| cuentas | Iniciar/cerrar sesión, registrar cuentas, editar perfil, cambiar contraseña y gestionar usuarios | useAuth, useCuentas |
| catalogo | Consultar equipos, registrar/editar equipo, imágenes y unidades | useCatalogo |
| solicitudes | Registrar, consultar y retirar solicitudes | useSolicitudes |
| reservas | Registrar, consultar y cancelar reservas y calcular su estado | useReservas |
| prestamos | Aprobar un préstamo, registrar entrega, renovar y registrar devolución | usePrestamos |

Los proveedores se montan en main.jsx. Cada contexto expone las operaciones de su historia y actualiza a sus consumidores al modificar datos. Los módulos de data conservan las reglas y persistencia en localStorage; las funciones auxiliares ajenas a React pueden seguir utilizándolos directamente. La migración de consumidores es gradual: no todas las pantallas consumen aún estos hooks.

DatosContext es infraestructura compartida para detectar cambios de las operaciones antiguas. No representa una historia de usuario. AuthContext conserva la sesión; CuentasContext agrupa operaciones de registro y administración.

Los .bak y scripts Python no son contextos ni dependencias de ejecución.

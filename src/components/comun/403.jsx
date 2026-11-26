import './403.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/cuentas/AuthContext'
import HeaderEstudiante from '../Header/Header-Estudiante'
import HeaderEncargado from '../Header/Header-Encargado'
import FooterEstudiante from '../Footer/Footer-Estudiante'
import FooterEncargado from '../Footer/Footer-Encargado'

const CORREO_SOPORTE = 'almacen.equipos@ulima.edu.pe'

const CONTENIDO = {
  estudiante: {
    texto: 'Esta sección pertenece al panel del encargado de almacén.',
    principal: { texto: 'Ir al catálogo', ruta: '/catalogo' },
    secundario: { texto: 'Ver mis solicitudes', ruta: '/estudiante/mis-solicitudes' },
  },
  encargado: {
    texto: 'Esta sección es exclusiva para estudiantes.',
    principal: { texto: 'Ir al inventario', ruta: '/encargado/inventario' },
    secundario: { texto: 'Ver solicitudes', ruta: '/encargado/aprobacion-entrega' },
  },
  visitante: {
    texto: 'Debes iniciar sesión para ver'}}
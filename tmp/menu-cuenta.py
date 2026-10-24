from pathlib import Path
p=Path('src/components/Header/Header-Estudiante.jsx');s=p.read_text(encoding='utf-8').replace('{ obtenerSesion, cerrarSesion }','{ obtenerSesion }');s="import MenuCuenta from './MenuCuenta'\n"+s;a=s.index('        <button\n          type="button"\n          className="hdr-est-usuario"');b=s.index('      </nav>',a);s=s[:a]+'''        <div className="hdr-est-perfil">
          <span className="hdr-est-nombre">{nombreCompleto}</span>
          <MenuCuenta iniciales={iniciales} onVerCuenta={() => navigate('/cuenta')} />
        </div>
'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('src/components/Header/Header-Encargado.jsx');s=p.read_text(encoding='utf-8').replace("import { useNavigate } from 'react-router-dom'\n",'').replace("import { cerrarSesion } from '../../data/cuentas'\n",'').replace('  const navigate = useNavigate()\n','');s="import MenuCuenta from './MenuCuenta'\n"+s;s=s.replace('  const perfil = datosPerfil(obtenerEncargadoActual(correo))','  const cuenta = obtenerEncargadoActual(correo)\n  const perfil = datosPerfil(cuenta)');a=s.index('          <button type="button" className="he-avatar"');b=s.index('          </button>',a)+len('          </button>');s=s[:a]+"          <MenuCuenta iniciales={perfil?.iniciales || '--'} cuenta={cuenta} />"+s[b:];p.write_text(s,encoding='utf-8')

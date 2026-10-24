from pathlib import Path
p=Path('src/components/Header/MenuCuenta.jsx');s=p.read_text(encoding='utf-8').replace('      else setAbierta(true)',"      else if (cuenta) setAbierta(true)\n      else navigate('/cuenta')");s=s.replace('    <select className="menu-cuenta-select"', '''    <div className="menu-cuenta-control">
      <span className="menu-cuenta-avatar" aria-hidden="true">{iniciales || 'U'}</span>
      <select className="menu-cuenta-select"''').replace("<option value=\"\" disabled>{iniciales || 'Cuenta'} ▾</option>",'<option value="" disabled>Mi cuenta</option>').replace('    </select>','''      </select>
      <svg className="menu-cuenta-flecha" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>''');p.write_text(s,encoding='utf-8')
p=Path('src/components/Header/MenuCuenta.css');s=p.read_text(encoding='utf-8');a=s.index('.menu-cuenta-fondo');s='''/* Selector compartido por ambos headers. */
.menu-cuenta-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 146px;
  height: 40px;
  border: 1px solid #cddde1;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px #163e4a0a;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.menu-cuenta-control:hover { border-color: #729da6; background: #f4f9fa; }
.menu-cuenta-control:focus-within { border-color: #195662; box-shadow: 0 0 0 3px #1956621a; }
.menu-cuenta-avatar {
  position: absolute;
  left: 6px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #194f5b;
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  pointer-events: none;
}
.menu-cuenta-select {
  appearance: none;
  width: 100%;
  height: 100%;
  padding: 0 29px 0 43px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #194f5b;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}
.menu-cuenta-select option { padding: 12px; background: #fff; color: #20343c; font-size: 13px; }
.menu-cuenta-select option[value="salir"] { color: #ac302b; }
.menu-cuenta-flecha { position: absolute; right: 10px; color: #50727b; pointer-events: none; }
@media (max-width: 600px) { .menu-cuenta-control { min-width: 136px; } }

'''+s[a:];p.write_text(s,encoding='utf-8')

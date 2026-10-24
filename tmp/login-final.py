from pathlib import Path
p=Path('src/pages/visitante/LoginPage.jsx');s=p.read_text(encoding='utf-8').replace("const DOMINIO = '@aloe.ulima.edu.pe'","const DOMINIO = '@aloe.ulima.edu.pe o @ulima.edu.pe'").replace(r'/^[^\s@]+@aloe\.ulima\.edu\.pe$/i',r'/^[^\s@]+@(?:aloe\.)?ulima\.edu\.pe$/i');p.write_text(s,encoding='utf-8')
p=Path('tmp/probar-ui.cjs');s=p.read_text(encoding='utf-8').replace('encargada@aloe.ulima.edu.pe','encargada@ulima.edu.pe');s=s.replace(" assert.equal(errors.length,0,errors.join('\\n'))",''' await page.evaluate(()=>{localStorage.setItem('sesionActual',JSON.stringify({correo:'20260001@aloe.ulima.edu.pe',rol:'estudiante'}));localStorage.setItem('rol','estudiante')})
 await page.goto('http://127.0.0.1:5174/catalogo');assert.equal(await page.locator('.header-visitante').count(),0)
 await page.locator('.catalogo-card').first().click();await page.waitForURL('**/catalogo/*')
 await page.goto('http://127.0.0.1:5174/estudiante/calendario?equipo=1')
 await page.getByRole('button',{name:'Mes siguiente',exact:true}).click()
 await page.locator('button.calendario-dia').nth(0).click();await page.locator('button.calendario-dia').nth(1).click()
 await page.getByRole('button',{name:'Reservar este rango',exact:true}).click()
 await page.getByRole('dialog',{name:'Reservar equipo'}).waitFor()
 await page.getByRole('dialog').getByRole('button',{name:'Confirmar reserva',exact:true}).click()
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('reservas')).filter(r=>!r.cancelada).length),1)
 await page.goto('http://127.0.0.1:5174/estudiante/mis-reservas');await page.getByRole('heading',{name:'Mis reservas',exact:true}).waitFor();assert.equal(await page.locator('tbody tr').count(),1)
 await page.goto('http://127.0.0.1:5174/encargado/reservas');assert.equal(await page.locator('tbody tr').count(),1)
 await page.goto('http://127.0.0.1:5174/login');await page.getByLabel('Correo institucional',{exact:true}).fill('encargada@ulima.edu.pe');await page.getByLabel('Contraseña',{exact:true}).fill('prueba');await page.getByRole('button',{name:'Ingresar',exact:true}).click();await page.waitForURL('**/encargado/inventario')
 assert.equal(errors.length,0,errors.join('\\n'))''');s=s.replace('Sin errores de navegador.','Reserva del calendario, Mis reservas, catálogo de estudiante e ingreso de encargado con @ulima.edu.pe. Sin errores de navegador.');p.write_text(s,encoding='utf-8')
# Preserve source backups without making ESLint analyze the old application a second time.
for p in Path('tmp/antes-conexiones').rglob('*'):
 if p.is_file() and p.suffix in ('.js','.jsx'): p.rename(p.with_suffix(p.suffix+'.bak'))

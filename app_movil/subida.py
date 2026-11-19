"""Subida de películas grandes por trozos de 4 MB.

El reenvío de puertos de Codespaces rechaza los envíos grandes (error 413), así que la página /subir manda el
archivo en trozos pequeños y aquí se vuelven a juntar.
"""
import os
import re
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse

TROZO = 4 * 1024 * 1024


def nombre_seguro(nombre):
    base, ext = os.path.splitext(os.path.basename(nombre or 'pelicula.mp4'))
    base = re.sub(r'[^\w\- ]+', '', base).strip()[:60] or 'pelicula'
    ext = re.sub(r'[^\w.]', '', ext.lower())[:6] or '.mp4'
    return base + ext


def rutas(app: FastAPI, carpeta):
    os.makedirs(carpeta, exist_ok=True)

    def parcial(ident):
        if not re.fullmatch(r'[A-Za-z0-9\-]{8,64}', ident or ''):
            raise HTTPException(400, 'id no válido')
        return os.path.join(carpeta, f'.{ident}.part')

    @app.get('/subir', response_class=HTMLResponse)
    def pagina():
        return PAGINA.replace('__TROZO__', str(TROZO))

    @app.post('/subir/trozo')
    async def trozo(request: Request, id: str, n: int):
        ruta = parcial(id)
        datos = await request.body()
        if n < 0 or len(datos) > TROZO:
            raise HTTPException(400, 'trozo no válido')
        with open(ruta, 'r+b' if os.path.exists(ruta) else 'wb') as f:
            f.seek(n * TROZO)
            f.write(datos)
        return {'ok': True}

    @app.post('/subir/fin')
    def fin(id: str, nombre: str, tamano: int):
        ruta = parcial(id)
        if not os.path.exists(ruta) or os.path.getsize(ruta) != tamano:
            raise HTTPException(400, 'La subida está incompleta. Vuelve a intentarlo.')
        final = nombre_seguro(nombre)
        if os.path.exists(os.path.join(carpeta, final)):
            b, e = os.path.splitext(final)
            final = f'{b} {time.strftime("%H%M%S")}{e}'
        os.replace(ruta, os.path.join(carpeta, final))
        return {'ok': True, 'nombre': final}


def subidas(carpeta):
    """Películas subidas y todavía sin usar, de la más nueva a la más vieja."""
    if not os.path.isdir(carpeta):
        return []
    archivos = [f for f in os.listdir(carpeta) if not f.startswith('.')]
    return sorted(archivos, key=lambda f: os.path.getmtime(os.path.join(carpeta, f)), reverse=True)


PAGINA = """<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Subir película</title>
<style>
:root{--fondo:#fff;--texto:#1f2328;--suave:#656d76;--borde:#d0d7de;--acento:#ea580c}
@media (prefers-color-scheme:dark){:root{--fondo:#0f1115;--texto:#e6edf3;--suave:#9198a1;--borde:#30363d}}
body{margin:0;background:var(--fondo);color:var(--texto);font:17px/1.5 system-ui,sans-serif}
main{max-width:560px;margin:auto;padding:24px 16px}
h1{font-size:1.5em;margin:0 0 8px}
p{color:var(--suave);margin:0 0 20px}
label.boton,button,a.boton{display:block;width:100%;box-sizing:border-box;text-align:center;padding:16px;border-radius:10px;
 font-size:1.1em;font-weight:600;border:0;cursor:pointer;text-decoration:none}
label.boton{background:var(--acento);color:#fff}
a.boton{background:transparent;color:var(--texto);border:1px solid var(--borde);margin-top:16px}
input[type=file]{display:none}
#barra{height:14px;background:var(--borde);border-radius:7px;overflow:hidden;margin:24px 0 8px;display:none}
#barra div{height:100%;width:0;background:var(--acento);transition:width .3s}
#estado{min-height:1.5em;font-weight:600}
</style></head><body><main>
<h1>📤 Subir película</h1>
<p>Elige la película o el trozo. No apagues la pantalla ni cambies de app hasta que termine.</p>
<label class="boton" for="archivo">Elegir vídeo</label>
<input type="file" id="archivo" accept="video/*,.mkv,.avi,.mov,.mp4">
<div id="barra"><div></div></div>
<div id="estado"></div>
<a class="boton" href="./">⬅️ Volver a la app</a>
</main>
<script>
const TROZO = __TROZO__;
const estado = document.getElementById('estado'), barra = document.getElementById('barra');
const espera = ms => new Promise(r => setTimeout(r, ms));
const mb = b => (b / 1048576).toFixed(0) + ' MB';
document.getElementById('archivo').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  let bloqueo = null;
  try { bloqueo = await navigator.wakeLock.request('screen'); } catch (_) {}
  const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2)).replace(/[^A-Za-z0-9-]/g, '');
  barra.style.display = 'block';
  const total = Math.max(1, Math.ceil(f.size / TROZO));
  try {
    for (let n = 0; n < total; n++) {
      let bien = false;
      for (let intento = 0; intento < 6 && !bien; intento++) {
        try {
          const r = await fetch(`subir/trozo?id=${id}&n=${n}`, {method: 'POST', body: f.slice(n * TROZO, (n + 1) * TROZO)});
          bien = r.ok;
        } catch (_) {}
        if (!bien) { estado.textContent = 'Conexión inestable, reintentando…'; await espera(3000); }
      }
      if (!bien) throw new Error('No se pudo subir. Revisa la conexión y vuelve a intentarlo.');
      barra.firstElementChild.style.width = (100 * (n + 1) / total) + '%';
      estado.textContent = `Subiendo… ${mb(Math.min(f.size, (n + 1) * TROZO))} de ${mb(f.size)}`;
    }
    const r = await fetch(`subir/fin?id=${id}&tamano=${f.size}&nombre=${encodeURIComponent(f.name)}`, {method: 'POST'});
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Error al terminar la subida.');
    estado.textContent = '✅ ¡Subida! Vuelve a la app y elígela en «Película subida».';
  } catch (err) {
    estado.textContent = '❌ ' + err.message;
  } finally {
    if (bloqueo) bloqueo.release();
  }
});
</script></body></html>
"""

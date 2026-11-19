"""Web para el móvil: subes una película (o un trozo) y te devuelve un resumen vertical con voz y subtítulos."""
import json
import os
import re
import threading
import time
import traceback
import unicodedata
from datetime import datetime

import gradio as gr

import motor

TRABAJOS = os.environ.get('DIR_TRABAJOS') or ('/data/trabajos' if os.path.isdir('/data') else os.path.join(motor.AQUI, 'trabajos'))
os.makedirs(TRABAJOS, exist_ok=True)
DURACIONES = {'1 minuto': 60, '1 minuto y medio': 90, '3 minutos': 180}
CALIDADES = {'Normal (recomendada)': 'precisa', 'Rápida (entiende peor los diálogos)': 'rapida'}


def slug(texto):
    t = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:40] or 'video'


def guardar_estado(carpeta, **datos):
    ruta = os.path.join(carpeta, 'estado.json')
    estado = leer_estado(carpeta)
    estado.update(datos)
    with open(ruta + '.tmp', 'w', encoding='utf-8') as f:
        json.dump(estado, f, ensure_ascii=False)
    os.replace(ruta + '.tmp', ruta)


def leer_estado(carpeta):
    try:
        with open(os.path.join(carpeta, 'estado.json'), encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def trabajar(carpeta, video, srt, opciones):
    def avisar(msg, frac=None):
        guardar_estado(carpeta, mensaje=msg, **({'progreso': frac} if frac is not None else {}))
    try:
        motor.procesar(video, carpeta, srt=srt, avisar=avisar, **opciones)
        guardar_estado(carpeta, estado='listo', mensaje='¡Listo!', progreso=1.0)
    except Exception as e:  # el error se enseña en la web
        traceback.print_exc()
        guardar_estado(carpeta, estado='error', mensaje=f'No se pudo crear el vídeo: {e}')
    finally:
        for ruta in (video, srt):  # libera espacio: la película subida ya no hace falta
            try:
                if ruta:
                    os.remove(ruta)
            except OSError:
                pass


def resultado(carpeta):
    video = os.path.join(carpeta, 'resumen.mp4')
    txt = os.path.join(carpeta, 'publicar.txt')
    texto = open(txt, encoding='utf-8').read() if os.path.exists(txt) else ''
    hay = os.path.exists(video)
    return (gr.update(value=video if hay else None, visible=hay), gr.update(value=[video, txt] if hay else None, visible=hay),
            gr.update(value=texto, visible=bool(texto)))


def crear(archivo, srt, titulo, duracion, volumen, calidad, notas, progress=gr.Progress()):
    if not archivo:
        raise gr.Error('Primero elige la película o el trozo de vídeo.')
    if not os.environ.get('ANTHROPIC_API_KEY'):
        raise gr.Error('Falta la clave de Claude (ANTHROPIC_API_KEY) en la configuración del Space.')
    try:
        motor.info_video(archivo)
    except Exception:
        raise gr.Error('Ese archivo no parece un vídeo. Prueba con un .mp4, .mkv, .mov o .avi.')
    titulo, notas = (titulo or '').strip(), (notas or '').strip()
    opciones = dict(titulo=titulo, objetivo=DURACIONES.get(duracion, 90), volumen=(volumen or 0) / 100,
                    calidad=CALIDADES.get(calidad, 'precisa'), notas=notas)
    nombre = titulo or os.path.splitext(os.path.basename(archivo))[0]
    carpeta = os.path.join(TRABAJOS, datetime.now().strftime('%Y%m%d-%H%M%S-') + slug(nombre))
    os.makedirs(carpeta)
    guardar_estado(carpeta, estado='trabajando', nombre=nombre, mensaje='Empezando…', progreso=0.0,
                   creado=datetime.now().strftime('%d/%m %H:%M'))
    threading.Thread(target=trabajar, args=(carpeta, archivo, srt, opciones), daemon=True).start()

    # El trabajo sigue aunque cierres la página: lo encontrarás en «Mis vídeos».
    while True:
        e = leer_estado(carpeta)
        progress(e.get('progreso') or 0, desc=e.get('mensaje', ''))
        if e.get('estado') == 'error':
            raise gr.Error(e['mensaje'], duration=None)
        if e.get('estado') == 'listo':
            return (f'✅ **{nombre}** está listo. Descárgalo abajo.', *resultado(carpeta))
        time.sleep(1.5)


def lista_trabajos():
    out = []
    for d in sorted(os.listdir(TRABAJOS), reverse=True):
        e = leer_estado(os.path.join(TRABAJOS, d))
        if e:
            icono = {'listo': '✅', 'error': '❌'}.get(e.get('estado'), '⏳')
            out.append((f"{icono} {e.get('nombre', d)} · {e.get('creado', '')}", d))
    return out


def refrescar():
    opciones = lista_trabajos()
    return gr.update(choices=opciones, value=opciones[0][1] if opciones else None)


OCULTOS = (gr.update(value=None, visible=False),) * 3


def ver(d):
    if not d:
        return 'Todavía no has creado ningún vídeo.', *OCULTOS
    carpeta = os.path.join(TRABAJOS, d)
    e = leer_estado(carpeta)
    if e.get('estado') == 'trabajando':
        pct = int(100 * (e.get('progreso') or 0))
        return f"⏳ {e.get('mensaje', '')} ({pct} %). Pulsa «Actualizar» en un rato.", *OCULTOS
    if e.get('estado') == 'error':
        return f"❌ {e.get('mensaje', '')}", *OCULTOS
    return f"✅ {e.get('nombre', d)}", *resultado(carpeta)


CSS = """
.gradio-container {max-width: 640px !important; margin: auto}
#crear {font-size: 1.15em; min-height: 3.2em}
"""

with gr.Blocks(title='Resúmenes de películas', delete_cache=(3600, 3 * 86400)) as demo:
    gr.Markdown('# 🎬 Resúmenes de películas\nSube una película o el trozo que quieras y te devuelvo un vídeo vertical '
                'con el resumen narrado y subtítulos, listo para TikTok, Shorts o Reels.')
    with gr.Tab('Crear'):
        archivo = gr.File(label='Película o trozo de vídeo', file_types=['video'], type='filepath')
        titulo = gr.Textbox(label='Título de la película (opcional)', placeholder='Ej.: El Gran Dictador')
        duracion = gr.Radio(list(DURACIONES), value='1 minuto y medio', label='Duración del resumen')
        with gr.Accordion('Más opciones', open=False):
            volumen = gr.Slider(0, 50, value=15, step=5, label='Volumen del sonido original de fondo (%)')
            calidad = gr.Radio(list(CALIDADES), value='Normal (recomendada)', label='Cómo escuchar los diálogos')
            srt = gr.File(label='Subtítulos .srt de la película (opcional; si los tienes, va mucho más rápido)',
                          file_types=['.srt'], type='filepath')
            notas = gr.Textbox(label='Indicaciones para el guion (opcional)',
                               placeholder='Ej.: tono de misterio, no cuentes el final')
        boton = gr.Button('🎬 Crear resumen', variant='primary', elem_id='crear')
        estado = gr.Markdown()
        video = gr.Video(label='Resumen', interactive=False, visible=False)
        descargas = gr.File(label='Descargar vídeo y texto', file_count='multiple', interactive=False, visible=False)
        texto = gr.Textbox(label='Texto para publicar', lines=8, buttons=['copy'], interactive=False, visible=False)
        boton.click(lambda: ('', *OCULTOS), None, [estado, video, descargas, texto]).then(crear, [archivo, srt, titulo, duracion, volumen, calidad, notas],
                    [estado, video, descargas, texto], concurrency_limit=1)
    with gr.Tab('Mis vídeos') as tab:
        gr.Markdown('Aquí están todos tus resúmenes, también los que siguen en marcha si cerraste la página.')
        elegido = gr.Dropdown(label='Vídeo', choices=[])
        actualizar = gr.Button('🔄 Actualizar')
        estado2 = gr.Markdown()
        video2 = gr.Video(label='Resumen', interactive=False, visible=False)
        descargas2 = gr.File(label='Descargar vídeo y texto', file_count='multiple', interactive=False, visible=False)
        texto2 = gr.Textbox(label='Texto para publicar', lines=8, buttons=['copy'], interactive=False, visible=False)
        salidas = [estado2, video2, descargas2, texto2]
        tab.select(refrescar, None, elegido).then(ver, elegido, salidas)
        actualizar.click(refrescar, None, elegido).then(ver, elegido, salidas)
        elegido.input(ver, elegido, salidas)

if __name__ == '__main__':
    clave = os.environ.get('APP_CLAVE')
    demo.queue(default_concurrency_limit=1).launch(
        server_name='0.0.0.0', max_file_size='6gb', css=CSS, allowed_paths=[TRABAJOS],
        auth=(lambda usuario, contrasena: contrasena == clave) if clave else None,
        auth_message='Escribe cualquier usuario y tu contraseña.',
    )

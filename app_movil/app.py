"""Web para el móvil: subes una película (o un trozo) y te devuelve un resumen vertical con voz y subtítulos.

Modo gratis: la app prepara un texto, tú lo pegas en la app de Claude y pegas aquí su respuesta.
"""
import json
import os
import re
import shutil
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
ICONOS = {'listo': '✅', 'error': '❌', 'esperando_guion': '📝'}


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


def borrar(*rutas):
    for ruta in rutas:
        try:
            if ruta:
                os.remove(ruta)
        except OSError:
            pass


def esperar(carpeta, fin, progress):
    """Va enseñando el progreso del trabajo en segundo plano hasta que llega al estado `fin`."""
    while True:
        e = leer_estado(carpeta)
        progress(e.get('progreso') or 0, desc=e.get('mensaje', ''))
        if e.get('estado') == 'error':
            raise gr.Error(e['mensaje'], duration=None)
        if e.get('estado') == fin:
            return e
        time.sleep(1.5)


# ----------------------------------------------------------------------------- paso 1: preparar
def hilo_preparar(carpeta, archivo, srt, opciones):
    def avisar(msg, frac=None):
        guardar_estado(carpeta, mensaje=msg, **({'progreso': frac} if frac is not None else {}))
    try:
        avisar('Guardando la película…', 0.01)
        video = os.path.join(carpeta, 'pelicula' + os.path.splitext(archivo)[1].lower())
        shutil.move(archivo, video)
        motor.preparar(video, carpeta, srt=srt, avisar=avisar, **opciones)
        guardar_estado(carpeta, estado='esperando_guion', mensaje='Falta el guion', progreso=1.0)
    except Exception as e:  # el error se enseña en la web
        traceback.print_exc()
        guardar_estado(carpeta, estado='error', mensaje=f'No se pudo preparar la película: {e}')
    finally:
        borrar(srt)


def preparar(archivo, srt, titulo, duracion, volumen, calidad, notas, progress=gr.Progress()):
    if not archivo:
        raise gr.Error('Primero elige la película o el trozo de vídeo.')
    try:
        motor.info_video(archivo)
    except Exception:
        raise gr.Error('Ese archivo no parece un vídeo. Prueba con un .mp4, .mkv, .mov o .avi.')
    titulo, notas = (titulo or '').strip(), (notas or '').strip()
    opciones = dict(titulo=titulo, objetivo=DURACIONES.get(duracion, 90), volumen=(volumen or 0) / 100,
                    calidad=CALIDADES.get(calidad, 'precisa'), notas=notas)
    nombre = titulo or os.path.splitext(os.path.basename(archivo))[0]
    d = datetime.now().strftime('%Y%m%d-%H%M%S-') + slug(nombre)
    carpeta = os.path.join(TRABAJOS, d)
    os.makedirs(carpeta)
    guardar_estado(carpeta, estado='preparando', nombre=nombre, mensaje='Empezando…', progreso=0.0,
                   creado=datetime.now().strftime('%d/%m %H:%M'))
    threading.Thread(target=hilo_preparar, args=(carpeta, archivo, srt, opciones), daemon=True).start()
    esperar(carpeta, 'esperando_guion', progress)  # si cierras la página, sigue en segundo plano
    return ('✅ Película preparada. Sigue con el paso 2 aquí abajo 👇', gr.update(visible=True),
            gr.update(choices=pendientes(), value=d), *mostrar_pedido(d))


# ----------------------------------------------------------------------------- paso 2: guion de Claude
def pendientes():
    out = []
    for d in sorted(os.listdir(TRABAJOS), reverse=True):
        e = leer_estado(os.path.join(TRABAJOS, d))
        if e.get('estado') == 'esperando_guion':
            out.append((f"{e.get('nombre', d)} · {e.get('creado', '')}", d))
    return out


def mostrar_pedido(d):
    ruta = os.path.join(TRABAJOS, d or '', 'pedido.txt')
    if not d or not os.path.exists(ruta):
        return '', None, ''
    return open(ruta, encoding='utf-8').read(), ruta, ''


def al_abrir():
    """Si dejaste una película a medias, la muestra para que puedas seguir."""
    p = pendientes()
    if not p:
        return gr.update(visible=False), gr.update(choices=[], value=None), '', None, ''
    return gr.update(visible=True), gr.update(choices=p, value=p[0][1]), *mostrar_pedido(p[0][1])


# ----------------------------------------------------------------------------- paso 3: montar el vídeo
def hilo_montar(carpeta, g):
    def avisar(msg, frac=None):
        guardar_estado(carpeta, mensaje=msg, **({'progreso': frac} if frac is not None else {}))
    try:
        motor.montar(carpeta, g, avisar)
        guardar_estado(carpeta, estado='listo', mensaje='¡Listo!', progreso=1.0)
        with open(os.path.join(carpeta, 'datos.json'), encoding='utf-8') as f:
            borrar(json.load(f)['video'])  # libera espacio: la película ya no hace falta
    except Exception as e:
        traceback.print_exc()
        guardar_estado(carpeta, estado='error', mensaje=f'No se pudo crear el vídeo: {e}')


def crear_video(d, respuesta, progress=gr.Progress()):
    def aviso(msg):  # problema con lo pegado: se explica sin borrar nada
        return (f'⚠️ {msg}', *OCULTOS, gr.update(), gr.update())
    if not d:
        return aviso('Primero prepara una película (paso 1).')
    if not (respuesta or '').strip():
        return aviso('Pega en el paso 3 la respuesta de Claude.')
    try:
        g = motor.leer_respuesta(respuesta)
    except ValueError as e:
        return aviso(str(e))
    carpeta = os.path.join(TRABAJOS, d)
    if leer_estado(carpeta).get('estado') != 'esperando_guion':
        return aviso('Esta película ya no está esperando guion. Mírala en «Mis vídeos».')
    guardar_estado(carpeta, estado='montando', mensaje='Empezando…', progreso=0.0)
    threading.Thread(target=hilo_montar, args=(carpeta, g), daemon=True).start()
    e = esperar(carpeta, 'listo', progress)
    return (f"✅ **{e.get('nombre', d)}** está listo. Descárgalo abajo.", *resultado(carpeta),
            gr.update(choices=pendientes(), value=None), '')


def resultado(carpeta):
    video = os.path.join(carpeta, 'resumen.mp4')
    txt = os.path.join(carpeta, 'publicar.txt')
    texto = open(txt, encoding='utf-8').read() if os.path.exists(txt) else ''
    hay = os.path.exists(video)
    return (gr.update(value=video if hay else None, visible=hay), gr.update(value=[video, txt] if hay else None, visible=hay),
            gr.update(value=texto, visible=bool(texto)))


OCULTOS = (gr.update(value=None, visible=False),) * 3


# ----------------------------------------------------------------------------- mis vídeos
def lista_trabajos():
    out = []
    for d in sorted(os.listdir(TRABAJOS), reverse=True):
        e = leer_estado(os.path.join(TRABAJOS, d))
        if e:
            out.append((f"{ICONOS.get(e.get('estado'), '⏳')} {e.get('nombre', d)} · {e.get('creado', '')}", d))
    return out


def refrescar():
    opciones = lista_trabajos()
    return gr.update(choices=opciones, value=opciones[0][1] if opciones else None)


def ver(d):
    if not d:
        return 'Todavía no has creado ningún vídeo.', *OCULTOS
    carpeta = os.path.join(TRABAJOS, d)
    e = leer_estado(carpeta)
    estado = e.get('estado')
    if estado == 'esperando_guion':
        return '📝 Falta el guion de Claude: ve a la pestaña **Crear** y sigue con el paso 2.', *OCULTOS
    if estado == 'error':
        return f"❌ {e.get('mensaje', '')}", *OCULTOS
    if estado != 'listo':
        pct = int(100 * (e.get('progreso') or 0))
        return f"⏳ {e.get('mensaje', '')} ({pct} %). Pulsa «Actualizar» en un rato.", *OCULTOS
    return f"✅ {e.get('nombre', d)}", *resultado(carpeta)


# ----------------------------------------------------------------------------- la página
CSS = """
.gradio-container {max-width: 640px !important; margin: auto}
.grande {font-size: 1.15em; min-height: 3.2em}
"""

with gr.Blocks(title='Resúmenes de películas', delete_cache=(3600, 3 * 86400)) as demo:
    gr.Markdown('# 🎬 Resúmenes de películas\nSube una película o el trozo que quieras y te devuelvo un vídeo vertical '
                'con el resumen narrado y subtítulos, listo para TikTok, Shorts o Reels.')
    with gr.Tab('Crear'):
        gr.Markdown('### Paso 1 · Sube la película')
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
        boton1 = gr.Button('1️⃣ Preparar película', variant='primary', elem_classes='grande')
        estado1 = gr.Markdown()

        with gr.Group(visible=False) as paso2:
            gr.Markdown('### Paso 2 · Pídele el guion a Claude\n'
                        '1. Toca el botón de **copiar** (⧉) del recuadro de abajo.\n'
                        '2. Abre la app de **Claude**, empieza un chat nuevo, pega el texto y envíalo.\n'
                        '3. Cuando conteste, copia **toda** su respuesta y pégala en el paso 3.')
            pendiente = gr.Dropdown(label='Película', choices=[])
            pedido = gr.Textbox(label='Texto para Claude', lines=5, max_lines=5, buttons=['copy'], interactive=False)
            pedido_txt = gr.File(label='¿Muy largo para copiar? Descarga el archivo y adjúntalo en Claude con el clip 📎',
                                 interactive=False)
            gr.Markdown('### Paso 3 · Pega la respuesta de Claude')
            respuesta = gr.Textbox(label='Respuesta de Claude', lines=5, max_lines=8,
                                   placeholder='Mantén pulsado aquí y elige «Pegar»')
            boton2 = gr.Button('2️⃣ Crear vídeo', variant='primary', elem_classes='grande')
        estado2 = gr.Markdown()
        video = gr.Video(label='Resumen', interactive=False, visible=False)
        descargas = gr.File(label='Descargar vídeo y texto', file_count='multiple', interactive=False, visible=False)
        texto = gr.Textbox(label='Texto para publicar', lines=8, buttons=['copy'], interactive=False, visible=False)

        boton1.click(preparar, [archivo, srt, titulo, duracion, volumen, calidad, notas],
                     [estado1, paso2, pendiente, pedido, pedido_txt, respuesta], concurrency_limit=1)
        pendiente.input(mostrar_pedido, pendiente, [pedido, pedido_txt, respuesta])
        boton2.click(lambda: ('', *OCULTOS), None, [estado2, video, descargas, texto]).then(
            crear_video, [pendiente, respuesta], [estado2, video, descargas, texto, pendiente, respuesta],
            concurrency_limit=1)

    with gr.Tab('Mis vídeos') as tab:
        gr.Markdown('Aquí están todos tus resúmenes, también los que siguen en marcha si cerraste la página.')
        elegido = gr.Dropdown(label='Vídeo', choices=[])
        actualizar = gr.Button('🔄 Actualizar')
        estado3 = gr.Markdown()
        video3 = gr.Video(label='Resumen', interactive=False, visible=False)
        descargas3 = gr.File(label='Descargar vídeo y texto', file_count='multiple', interactive=False, visible=False)
        texto3 = gr.Textbox(label='Texto para publicar', lines=8, buttons=['copy'], interactive=False, visible=False)
        salidas = [estado3, video3, descargas3, texto3]
        tab.select(refrescar, None, elegido).then(ver, elegido, salidas)
        actualizar.click(refrescar, None, elegido).then(ver, elegido, salidas)
        elegido.input(ver, elegido, salidas)

    demo.load(al_abrir, None, [paso2, pendiente, pedido, pedido_txt, respuesta])

if __name__ == '__main__':
    clave = os.environ.get('APP_CLAVE')
    demo.queue(default_concurrency_limit=1).launch(
        server_name='0.0.0.0', max_file_size='6gb', css=CSS, allowed_paths=[TRABAJOS],
        auth=(lambda usuario, contrasena: contrasena == clave) if clave else None,
        auth_message='Escribe cualquier usuario y tu contraseña.',
    )

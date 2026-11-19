"""Motor de la app: película → transcripción → guion con Claude → voz Piper → vídeo vertical con subtítulos.

Se puede usar sin la web:  python3 motor.py pelicula.mp4 [--srt subtitulos.srt] [--titulo "..."] [--duracion 90]
"""
import argparse
import base64
import json
import math
import os
import re
import subprocess
import sys
import tarfile
import urllib.request
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
VOCES = os.path.join(AQUI, 'voces')
MODELO = os.path.join(VOCES, 'es-mls_10246-low.onnx')
URL_MODELO = 'https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-mls_10246-low.tar.gz'
SR = 44100
FPS = 30
VELOCIDAD = 0.97          # length_scale de Piper (<1 = más rápido)
PAUSA = 0.35              # silencio entre escenas
PALABRAS_POR_SEG = 2.6    # ritmo de la voz, para calcular cuánto texto cabe
FUENTE = 'DejaVu Sans'


# ----------------------------------------------------------------------------- utilidades
def ejecutar(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, **kw)
    if r.returncode != 0:
        err = r.stderr.decode(errors='replace')[-1500:] if isinstance(r.stderr, bytes) else str(r.stderr)
        raise RuntimeError(f'Falló {cmd[0]}: {err}')
    return r


def info_video(ruta):
    r = ejecutar(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type',
                  '-of', 'json', ruta])
    d = json.loads(r.stdout)
    tipos = {s.get('codec_type') for s in d.get('streams', [])}
    if 'video' not in tipos:
        raise ValueError('El archivo no tiene imagen de vídeo.')
    return float(d['format']['duration']), 'audio' in tipos


def hms(s):
    s = int(s)
    return f'{s // 3600:d}:{s % 3600 // 60:02d}:{s % 60:02d}'


# ----------------------------------------------------------------------------- 1 · transcripción
_whisper = {}


def transcribir(video, calidad='rapida', avisar=print):
    """Devuelve [(inicio, fin, texto)] con lo que se dice en la película (cualquier idioma)."""
    from faster_whisper import WhisperModel
    nombre = 'small' if calidad == 'precisa' else 'base'
    if nombre not in _whisper:
        avisar(f'Cargando el reconocedor de voz ({nombre})…')
        _whisper[nombre] = WhisperModel(nombre, device='cpu', compute_type='int8')
    # el audio lo saca ffmpeg (16 kHz mono) para no depender de la versión de PyAV
    crudo = ejecutar(['ffmpeg', '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-']).stdout
    audio = np.frombuffer(crudo, dtype=np.float32)
    segmentos, info = _whisper[nombre].transcribe(audio, vad_filter=True, beam_size=1)
    out = []
    for s in segmentos:
        t = s.text.strip()
        if t:
            out.append((s.start, s.end, t))
            avisar(f'Escuchando la película… {hms(s.end)} / {hms(info.duration)}', s.end / max(info.duration, 1))
    return out


def leer_srt(ruta):
    with open(ruta, encoding='utf-8-sig', errors='replace') as f:
        bloques = re.split(r'\n\s*\n', f.read().replace('\r', ''))
    patron = re.compile(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)')
    out = []
    for b in bloques:
        lineas = b.strip().split('\n')
        for i, l in enumerate(lineas):
            m = patron.search(l)
            if m:
                g = [int(x) for x in m.groups()]
                ini = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
                fin = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
                texto = re.sub(r'<[^>]+>|\{[^}]+\}', '', ' '.join(lineas[i + 1:])).strip()
                if texto:
                    out.append((ini, fin, texto))
                break
    return out


def fotogramas(video, duracion, carpeta, n=None):
    """Capturas repartidas por la película para que Claude vea lo que pasa (también en escenas sin diálogo)."""
    n = n or int(min(40, max(8, duracion / 150)))
    os.makedirs(carpeta, exist_ok=True)
    out = []
    for i in range(n):
        t = duracion * (i + 0.5) / n
        ruta = os.path.join(carpeta, f'f{i:02d}.jpg')
        try:
            ejecutar(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', video, '-frames:v', '1',
                      '-vf', 'scale=480:-2', '-q:v', '6', ruta])
            if os.path.getsize(ruta) > 0:
                out.append((t, ruta))
        except RuntimeError:
            pass
    return out


# ----------------------------------------------------------------------------- 2 · guion con Claude
ESQUEMA = {
    'type': 'object',
    'additionalProperties': False,
    'required': ['titulo', 'escenas', 'publicacion'],
    'properties': {
        'titulo': {'type': 'string', 'description': 'Rótulo corto que se verá arriba del vídeo (máx. 40 caracteres).'},
        'escenas': {
            'type': 'array',
            'items': {
                'type': 'object',
                'additionalProperties': False,
                'required': ['inicio', 'narracion'],
                'properties': {
                    'inicio': {'type': 'number', 'description': 'Segundo de la película donde empieza la imagen de esta escena.'},
                    'narracion': {'type': 'string', 'description': 'Lo que dice la voz durante esta escena.'},
                },
            },
        },
        'publicacion': {
            'type': 'object',
            'additionalProperties': False,
            'required': ['titulo', 'descripcion', 'hashtags'],
            'properties': {
                'titulo': {'type': 'string'},
                'descripcion': {'type': 'string'},
                'hashtags': {'type': 'array', 'items': {'type': 'string'}},
            },
        },
    },
}

INSTRUCCIONES = """Eres guionista de vídeos verticales (Shorts, TikTok, Reels) que resumen películas en español.
Recibes lo que se dice en una película o en un fragmento (con el segundo en que se dice, puede estar en cualquier idioma) y, a veces, capturas de imagen con su segundo. Escribes la narración del resumen y eliges qué trozo de la película se ve mientras suena cada frase.

Reglas:
- Narración en español neutro, con tus propias palabras, en presente, frases cortas y con ritmo. Nunca copies diálogos.
- La primera frase es un gancho (una pregunta o una situación intrigante). La última cierra la historia o deja una reflexión breve.
- Cuenta solo lo que se ve o se dice en el material recibido. Si es un fragmento, resume ese fragmento. No inventes nombres ni hechos; si no sabes cómo se llama un personaje, descríbelo ("el detective", "la chica").
- Cada escena: 1 o 2 frases (entre 8 y 30 palabras). Las escenas siguen el orden de la historia.
- `inicio`: el segundo de la película cuya imagen encaja con lo que dice la narración en esa escena. Usa los tiempos de los diálogos y de las capturas para acertar. No repitas el mismo momento y deja al menos 15 segundos hasta el final del archivo.
- `titulo`: rótulo corto para la parte de arriba del vídeo, p. ej. "RESUMEN: EL TÍTULO" o una frase de gancho.
- `publicacion`: título con gancho para publicar (máx. 70 caracteres, sin destripar el final), descripción de 2 o 3 frases que diga que es un resumen con spoilers (y el título de la película si lo sabes), y 8 a 12 hashtags sin #."""


def texto_transcripcion(segs, max_lineas=4000):
    if not segs:
        return '(No se ha detectado diálogo.)'
    if len(segs) > max_lineas:  # películas muy largas: junta frases cercanas para no pasarse
        paso = math.ceil(len(segs) / max_lineas)
        segs = [(segs[i][0], segs[min(i + paso, len(segs)) - 1][1], ' '.join(s[2] for s in segs[i:i + paso]))
                for i in range(0, len(segs), paso)]
    return '\n'.join(f'[{a:.0f}s] {t}' for a, _, t in segs)


def texto_pedido(segs, duracion, objetivo, titulo='', notas=''):
    palabras = int(objetivo * PALABRAS_POR_SEG)
    escenas = max(4, round(objetivo / 6))
    return (f'Duración del archivo: {duracion:.0f} segundos ({hms(duracion)}).\n'
            + (f'Película: {titulo}\n' if titulo else '')
            + f'Duración del resumen: unos {objetivo} segundos, es decir, unas {palabras} palabras de narración '
              f'repartidas en unas {escenas} escenas.\n'
            + (f'Indicaciones extra: {notas}\n' if notas else '')
            + f'\nDIÁLOGOS (segundo y texto):\n{texto_transcripcion(segs)}\n\nCAPTURAS:')


def generar_guion(segs, fotos, duracion, objetivo, titulo='', notas=''):
    import anthropic
    client = anthropic.Anthropic()  # usa ANTHROPIC_API_KEY
    contenido = [{'type': 'text', 'text': texto_pedido(segs, duracion, objetivo, titulo, notas)}]
    for t, ruta in fotos:
        with open(ruta, 'rb') as f:
            datos = base64.standard_b64encode(f.read()).decode('utf-8')
        contenido.append({'type': 'text', 'text': f'Captura en el segundo {t:.0f}:'})
        contenido.append({'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': datos}})
    resp = client.beta.messages.create(
        model='claude-opus-5-5',
        max_tokens=16000,
        betas=['server-side-fallback-2026-07-01'],
        fallbacks='default',
        output_config={'effort': 'medium', 'format': {'type': 'json_schema', 'schema': ESQUEMA}},
        system=INSTRUCCIONES,
        messages=[{'role': 'user', 'content': contenido}],
    )
    if resp.stop_reason == 'refusal':
        raise RuntimeError('Claude no ha querido resumir este material. Prueba con otro archivo.')
    if resp.stop_reason == 'max_tokens':
        raise RuntimeError('La respuesta de Claude se cortó. Vuelve a intentarlo.')
    g = json.loads(next(b.text for b in resp.content if b.type == 'text'))
    g['escenas'] = [e for e in g['escenas'] if e['narracion'].strip()]
    if not g['escenas']:
        raise RuntimeError('Claude no ha devuelto ninguna escena.')
    return g


# ----------------------------------------------------------------------------- 3 · voz
def asegurar_voz():
    if os.path.exists(MODELO):
        return
    os.makedirs(VOCES, exist_ok=True)
    tgz = os.path.join(VOCES, 'voz.tar.gz')
    urllib.request.urlretrieve(URL_MODELO, tgz)
    with tarfile.open(tgz) as t:
        for m in t.getmembers():
            if m.isfile():
                m.name = os.path.basename(m.name)
                t.extract(m, VOCES)
    os.remove(tgz)


def leer_wav(ruta):
    with wave.open(ruta) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels()).mean(axis=1)


def escribir_wav(x, ruta):
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def sintetizar(texto, tmp):
    asegurar_voz()
    crudo, proc = tmp + '_raw.wav', tmp + '.wav'
    ejecutar([sys.executable, '-m', 'piper', '-m', MODELO, '-c', MODELO + '.json', '-f', crudo,
              '--length-scale', str(VELOCIDAD), '--noise-scale', '0.5', '--noise-w', '0.3', '--sentence-silence', '0.12'],
             input=texto.encode())
    filtro = (f'aresample={SR}:resampler=soxr,highpass=f=85,lowpass=f=7800,equalizer=f=200:t=q:w=1:g=2,'
              'equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=140:makeup=4')
    ejecutar(['ffmpeg', '-v', 'error', '-y', '-i', crudo, '-af', filtro, '-ac', '1', proc])
    x = leer_wav(proc)
    os.remove(crudo); os.remove(proc)
    idx = np.where(np.abs(x) > 0.01)[0]
    return x[max(0, idx[0] - 600):idx[-1] + 2600] if len(idx) else x


# ----------------------------------------------------------------------------- 4 · subtítulos
def tiempos_palabras(texto, inicio, dur):
    ws = texto.split()
    pesos = [len(re.sub(r'\W', '', w)) + 2.5 + (2 if re.search(r'[,;:.!?…]$', w) else 0) for w in ws]
    total, c, out = sum(pesos), inicio, []
    for w, p in zip(ws, pesos):
        d = dur * p / total
        out.append((w, c, c + d))
        c += d
    return out


def ass_t(s):
    cs = int(round(s * 100))
    return f'{cs // 360000:d}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'


def ass_txt(t):
    return t.replace('\\', '/').replace('{', '(').replace('}', ')')


def subtitulos(palabras, titulo, total, ruta):
    """Subtítulos grandes de 1 a 4 palabras, con la palabra que suena en amarillo."""
    cab = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,{FUENTE},84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,7,3,2,70,70,430,1
Style: Titulo,{FUENTE},62,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB4000000,-1,0,0,0,100,100,0,0,3,18,0,8,80,80,230,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = [f'Dialogue: 0,{ass_t(0)},{ass_t(total)},Titulo,,0,0,0,,{ass_txt(titulo.upper())}']
    grupos, actual = [], []
    for p in palabras:
        actual.append(p)
        if len(actual) == 4 or re.search(r'[,;:.!?…]$', p[0]):
            grupos.append(actual); actual = []
    if actual:
        grupos.append(actual)
    for g in grupos:
        for i, (w, a, b) in enumerate(g):
            fin = g[i + 1][1] if i + 1 < len(g) else b
            texto = ' '.join((r'{\c&H00FFFF&}' + ass_txt(x) + r'{\c&HFFFFFF&}') if j == i else ass_txt(x)
                             for j, (x, _, _) in enumerate(g))
            ev.append(f'Dialogue: 1,{ass_t(a)},{ass_t(fin)},Sub,,0,0,0,,{texto}')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write(cab + '\n'.join(ev) + '\n')


# ----------------------------------------------------------------------------- 5 · montaje
def cortar(video, tiene_audio, ini, dur, volumen, salida):
    """Un trozo de la película en vertical: la imagen completa en el centro y la misma, desenfocada, de fondo."""
    vf = (f'[0:v]fps={FPS},split=2[a][b];'
          '[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.12[fondo];'
          '[b]scale=1080:1920:force_original_aspect_ratio=decrease[img];'
          '[fondo][img]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[v]')
    if tiene_audio and volumen > 0:
        af = f'[0:a]aresample={SR},aformat=channel_layouts=stereo,volume={volumen:.2f},apad,atrim=0:{dur:.3f}[s]'
        extra = []
    else:
        af = f'[1:a]atrim=0:{dur:.3f}[s]'
        extra = ['-f', 'lavfi', '-i', f'anullsrc=r={SR}:cl=stereo']
    ejecutar(['ffmpeg', '-v', 'error', '-y', '-ss', f'{ini:.3f}', '-t', f'{dur + 0.5:.3f}', '-i', video, *extra,
              '-filter_complex', vf + ';' + af, '-map', '[v]', '-map', '[s]', '-frames:v', str(round(dur * FPS)),
              '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '16', '-c:a', 'pcm_s16le', '-ar', str(SR),
              '-t', f'{dur:.3f}', salida])


# ----------------------------------------------------------------------------- 6 · el proceso completo
FORMATO = """Responde SOLO con un bloque de código JSON (sin texto antes ni después) con esta forma exacta:
```json
{
  "titulo": "RESUMEN: ...",
  "escenas": [
    {"inicio": 12, "narracion": "Primera frase de la narración..."},
    {"inicio": 95, "narracion": "Siguiente frase..."}
  ],
  "publicacion": {"titulo": "...", "descripcion": "...", "hashtags": ["cine", "resumen"]}
}
```"""


def preparar(video, carpeta, srt=None, titulo='', objetivo=90, volumen=0.15, calidad='precisa', notas='',
             avisar=lambda msg, frac=None: print(msg)):
    """Paso 1: escucha la película y deja en `carpeta` el pedido para Claude (pedido.txt)."""
    os.makedirs(os.path.join(carpeta, 'tmp'), exist_ok=True)
    duracion, tiene_audio = info_video(video)
    if srt:
        avisar('Leyendo los subtítulos…', 0.05)
        segs = leer_srt(srt)
    elif tiene_audio:
        avisar('Escuchando la película (en una película entera tarda un buen rato)…', 0.02)
        segs = transcribir(video, calidad, lambda m, f=None: avisar(m, 0.02 + 0.96 * (f or 0)))
    else:
        segs = []
    datos = dict(video=video, duracion=duracion, tiene_audio=tiene_audio, titulo=titulo, objetivo=objetivo,
                 volumen=volumen, notas=notas, segs=segs)
    with open(os.path.join(carpeta, 'datos.json'), 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False)
    pedido = (INSTRUCCIONES + '\n\n' + FORMATO + '\n\n' + texto_pedido(segs, duracion, objetivo, titulo, notas)
              .replace('\n\nCAPTURAS:', ''))
    with open(os.path.join(carpeta, 'pedido.txt'), 'w', encoding='utf-8') as f:
        f.write(pedido)
    return pedido


def leer_respuesta(texto):
    """Saca el guion de lo que has copiado de Claude (aunque venga con ```json o con texto alrededor)."""
    m = re.search(r'```(?:json)?\s*(\{.*\})\s*```', texto, re.S)
    bruto = m.group(1) if m else texto[texto.find('{'):texto.rfind('}') + 1]
    try:
        g = json.loads(bruto)
    except ValueError:
        raise ValueError('No encuentro el guion en lo que has pegado. Copia la respuesta completa de Claude '
                         '(el bloque que empieza por { y termina por }).')
    escenas = []
    for e in g.get('escenas') or []:
        try:
            if str(e.get('narracion', '')).strip():
                escenas.append({'inicio': float(e['inicio']), 'narracion': str(e['narracion']).strip()})
        except (KeyError, TypeError, ValueError):
            continue
    if not escenas:
        raise ValueError('La respuesta no trae escenas. Pídele a Claude que repita la respuesta en el formato JSON.')
    p = g.get('publicacion') or {}
    return {'titulo': str(g.get('titulo') or 'RESUMEN'), 'escenas': escenas,
            'publicacion': {'titulo': str(p.get('titulo') or g.get('titulo') or ''), 'descripcion': str(p.get('descripcion') or ''),
                            'hashtags': [str(h) for h in (p.get('hashtags') or [])]}}


def montar(carpeta, g, avisar=lambda msg, frac=None: print(msg)):
    """Paso 2: con el guion, graba la voz, corta las escenas y monta el vídeo. Devuelve (vídeo, texto para publicar)."""
    with open(os.path.join(carpeta, 'datos.json'), encoding='utf-8') as f:
        d = json.load(f)
    video, duracion, tiene_audio, volumen = d['video'], d['duracion'], d['tiene_audio'], d['volumen']
    tmp = os.path.join(carpeta, 'tmp')
    os.makedirs(tmp, exist_ok=True)
    with open(os.path.join(carpeta, 'guion.json'), 'w', encoding='utf-8') as f:
        json.dump(g, f, ensure_ascii=False, indent=2)

    # voz de cada escena y línea de tiempo
    voz, palabras, tramos, t = [], [], [], 0.0
    n = len(g['escenas'])
    for i, e in enumerate(g['escenas']):
        avisar(f'Grabando la voz ({i + 1}/{n})…', 0.02 + 0.2 * i / n)
        x = sintetizar(e['narracion'], os.path.join(tmp, f'voz{i}'))
        habla = len(x) / SR
        dur = math.ceil((habla + PAUSA + (1.2 if i == n - 1 else 0)) * FPS) / FPS
        ini = min(max(0.0, float(e['inicio'])), max(0.0, duracion - dur - 0.2))
        palabras += tiempos_palabras(e['narracion'], t + 0.1, habla - 0.15)
        pista = np.zeros(int(round(dur * SR)))
        a = int(0.1 * SR)
        pista[a:a + len(x)] = x[:len(pista) - a]
        voz.append(pista)
        tramos.append((ini, dur))
        t += dur
    escribir_wav(np.concatenate(voz), os.path.join(tmp, 'voz.wav'))
    subtitulos(palabras, g['titulo'], t, os.path.join(tmp, 'subs.ass'))

    # trozos de la película
    lista = os.path.join(tmp, 'lista.txt')
    with open(lista, 'w') as f:
        for i, (ini, dur) in enumerate(tramos):
            avisar(f'Cortando escenas ({i + 1}/{n})…', 0.25 + 0.5 * i / n)
            trozo = os.path.join(tmp, f'trozo{i:02d}.mkv')
            cortar(video, tiene_audio, ini, dur, volumen, trozo)
            f.write(f"file '{trozo}'\n")

    # unir, mezclar la voz y quemar los subtítulos
    avisar('Montando el vídeo final…', 0.8)
    salida = os.path.join(carpeta, 'resumen.mp4')
    subs = os.path.join(tmp, 'subs.ass').replace('\\', '/').replace(':', r'\:').replace("'", r"\'")
    ejecutar(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-i', os.path.join(tmp, 'voz.wav'),
              '-filter_complex',
              f"[0:v]ass='{subs}'[v];[1:a]aformat=channel_layouts=stereo[n];"
              '[0:a][n]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]',
              '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
              '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', salida])

    p = g['publicacion']
    texto = (f"{p['titulo']}\n\n{p['descripcion']}\n\n" + ' '.join('#' + h.lstrip('#').replace(' ', '') for h in p['hashtags'])
             + '\n\n--- Narración ---\n' + '\n'.join(e['narracion'] for e in g['escenas']) + '\n')
    with open(os.path.join(carpeta, 'publicar.txt'), 'w', encoding='utf-8') as f:
        f.write(texto)
    for nombre in os.listdir(tmp):
        if nombre.endswith('.mkv'):
            os.remove(os.path.join(tmp, nombre))
    avisar('¡Listo!', 1.0)
    return salida, texto


def procesar(video, carpeta, srt=None, titulo='', objetivo=90, volumen=0.15, calidad='precisa', notas='',
             avisar=lambda msg, frac=None: print(msg)):
    """Todo seguido, con la API de Claude (necesita ANTHROPIC_API_KEY, de pago)."""
    preparar(video, carpeta, srt, titulo, objetivo, volumen, calidad, notas, lambda m, f=None: avisar(m, 0.4 * (f or 0)))
    with open(os.path.join(carpeta, 'datos.json'), encoding='utf-8') as f:
        d = json.load(f)
    avisar('Sacando capturas de la película…', 0.42)
    fotos = fotogramas(video, d['duracion'], os.path.join(carpeta, 'tmp', 'capturas'))
    avisar('Claude está escribiendo el resumen…', 0.45)
    g = generar_guion(d['segs'], fotos, d['duracion'], objetivo, titulo, notas)
    return montar(carpeta, g, lambda m, f=None: avisar(m, 0.55 + 0.45 * (f or 0)))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('video')
    ap.add_argument('--srt')
    ap.add_argument('--titulo', default='')
    ap.add_argument('--duracion', type=int, default=90)
    ap.add_argument('--volumen', type=float, default=0.15)
    ap.add_argument('--rapida', action='store_true')
    ap.add_argument('--respuesta', help='archivo con la respuesta de Claude copiada (modo gratis)')
    ap.add_argument('--salida', default='trabajos/prueba')
    a = ap.parse_args()
    calidad = 'rapida' if a.rapida else 'precisa'
    if os.environ.get('ANTHROPIC_API_KEY'):
        v, txt = procesar(a.video, a.salida, a.srt, a.titulo, a.duracion, a.volumen, calidad)
    elif not a.respuesta:
        print(preparar(a.video, a.salida, a.srt, a.titulo, a.duracion, a.volumen, calidad))
        sys.exit(f'\nPega lo de arriba en Claude, guarda su respuesta en un archivo y repite con --respuesta archivo')
    else:
        g = leer_respuesta(open(a.respuesta, encoding='utf-8').read())
        v, txt = montar(a.salida, g)
    print(v)
    print(txt)

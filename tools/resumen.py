#!/usr/bin/env python3
"""
FÁBRICA DE RESÚMENES DE PELÍCULAS  ·  guion → voz → vídeo vertical → texto para publicar

    python3 tools/resumen.py nuevo "Nosferatu" --anio 1922      # escribe el guion con Claude (API)
    python3 tools/resumen.py plantilla mi-peli                  # guion vacío para rellenar a mano
    python3 tools/resumen.py todo nosferatu                     # voz + música + vídeo + publicación
    python3 tools/resumen.py lote peliculas.txt                 # un vídeo por cada línea "Título | año"
    python3 tools/resumen.py catalogo                           # escenarios, peinados, ropa, emociones…

Pasos sueltos:  narrar <slug> · render <slug> · publicar <slug> · validar <slug>

Archivos de cada película (slug = nombre de carpeta):
    resumenes/<slug>/guion.json          guion (lo único que hay que escribir)
    resumenes/<slug>/props.json          guion + tiempos de cada palabra (lo genera `narrar`)
    public/resumenes/<slug>/*.mp3        narración y música
    out/resumenes/<slug>.mp4             vídeo final 1080×1920
    out/resumenes/<slug>.txt             título, descripción y hashtags para YouTube Shorts / TikTok / Reels
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tarfile
import unicodedata
import urllib.request
import wave

import numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VOCES = os.path.join(RAIZ, 'tools', 'voces')
MODELO = os.path.join(VOCES, 'es-mls_10246-low.onnx')
URL_MODELO = 'https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-mls_10246-low.tar.gz'
SR = 44100

# --------------------------------------------------------------------------- catálogo
ESCENARIOS = {
    'ciudadNoche': 'ciudad moderna de noche, rascacielos, tráfico',
    'parque': 'parque de día, nubes, pájaros',
    'playa': 'playa al atardecer, olas, palmera',
    'espacio': 'espacio exterior, planetas, nebulosa',
    'bosque': 'bosque con niebla y luciérnagas',
    'hospital': 'habitación de hospital, monitor cardíaco',
    'aula': 'aula de colegio, pizarra',
    'oficina': 'oficina con ventanal y ordenador',
    'montana': 'montaña nevada con aurora boreal',
    'marino': 'fondo del mar, peces, corales',
    'desierto': 'desierto con dunas y pirámides',
    'laboratorio': 'laboratorio científico, matraces, ADN',
    'cocina': 'cocina de casa, fogón, nevera',
    'cyberpunk': 'ciudad futurista de neón con lluvia',
    'selva': 'selva tropical con cascada',
    'castillo': 'interior de castillo con antorchas',
    'volcan': 'volcán con lava y ceniza',
    'estacion': 'pasillo de estación espacial / nave',
    'japon': 'jardín japonés, pagoda, cerezos',
    'granja': 'granja, granero, molino, campo',
    'steampunk': 'taller antiguo con engranajes y vapor',
}
PEINADOS = ['corto', 'coleta', 'coletas', 'calvo', 'mono', 'casco', 'gorroChef', 'sombrero', 'robot']
ROPAS = ['camiseta', 'bata', 'espacial', 'delantal', 'explorador', 'chaleco', 'metal', 'sudadera']
EMOCIONES = ['neutral', 'alegria', 'miedo', 'tension', 'tristeza', 'sorpresa', 'enfado']
TEMAS = ['original', 'calido', 'frio', 'neon', 'pastel', 'noir', 'sepia', 'terror', 'bosque']
BOOL_PJ = ['gafas', 'bigote', 'pajarita', 'mochila', 'pecas', 'estetoscopio']
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')

# --------------------------------------------------------------------------- utilidades


def slugify(texto):
    s = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-') or 'pelicula'


def rutas(slug):
    return {
        'dir': os.path.join(RAIZ, 'resumenes', slug),
        'guion': os.path.join(RAIZ, 'resumenes', slug, 'guion.json'),
        'props': os.path.join(RAIZ, 'resumenes', slug, 'props.json'),
        'public': os.path.join(RAIZ, 'public', 'resumenes', slug),
        'mp4': os.path.join(RAIZ, 'out', 'resumenes', f'{slug}.mp4'),
        'txt': os.path.join(RAIZ, 'out', 'resumenes', f'{slug}.txt'),
    }


def leer_guion(slug):
    with open(rutas(slug)['guion'], encoding='utf-8') as f:
        return json.load(f)


def validar(g):
    """Comprueba el guion y corrige lo que se pueda. Devuelve la lista de errores graves."""
    errores = []
    if g.get('tema') not in TEMAS:
        g['tema'] = 'original'
    ids = set()
    for p in g.get('reparto', []):
        ids.add(p.get('id'))
        if p.get('peinado') not in PEINADOS:
            p['peinado'] = 'corto'
        if p.get('ropa') not in ROPAS:
            p['ropa'] = 'camiseta'
        for c, defecto in (('piel', '#e8b896'), ('pelo', '#2a1a12'), ('colorRopa', '#3a4a6a'), ('colorRopa2', '#c8c8d0')):
            if not HEX.match(str(p.get(c, ''))):
                p[c] = defecto
        if p.get('iris') and not HEX.match(str(p['iris'])):
            del p['iris']
        for b in BOOL_PJ:
            p[b] = bool(p.get(b, False))
    if not g.get('escenas'):
        errores.append('el guion no tiene escenas')
    for i, e in enumerate(g.get('escenas', [])):
        if e.get('escenario') not in ESCENARIOS:
            errores.append(f'escena {i + 1}: escenario "{e.get("escenario")}" no existe (usa `catalogo`)')
        if e.get('emocion') not in EMOCIONES:
            e['emocion'] = 'neutral'
        falta = [x for x in e.get('personajes', []) if x not in ids]
        if falta:
            errores.append(f'escena {i + 1}: personajes sin definir en el reparto: {falta}')
        e['personajes'] = e.get('personajes', [])[:2]
        if not e.get('frases'):
            errores.append(f'escena {i + 1}: sin frases')
    palabras = sum(len(fr.split()) for e in g.get('escenas', []) for fr in e.get('frases', []))
    if palabras > 330:
        print(f'aviso: {palabras} palabras ≈ {palabras / 2.6:.0f} s de vídeo (lo ideal para Shorts es 150–230)')
    return errores


# --------------------------------------------------------------------------- 1 · guion con Claude

ESQUEMA = {
    'type': 'object',
    'additionalProperties': False,
    'required': ['pelicula', 'tema', 'reparto', 'escenas', 'publicacion'],
    'properties': {
        'pelicula': {
            'type': 'object', 'additionalProperties': False,
            'required': ['titulo', 'anio', 'director', 'genero'],
            'properties': {'titulo': {'type': 'string'}, 'anio': {'type': 'integer'}, 'director': {'type': 'string'}, 'genero': {'type': 'string'}},
        },
        'tema': {'type': 'string', 'enum': TEMAS},
        'reparto': {
            'type': 'array',
            'items': {
                'type': 'object', 'additionalProperties': False,
                'required': ['id', 'nombre', 'piel', 'pelo', 'peinado', 'ropa', 'colorRopa', 'colorRopa2'] + BOOL_PJ,
                'properties': {
                    'id': {'type': 'string', 'description': 'identificador corto en minúsculas sin espacios'},
                    'nombre': {'type': 'string'},
                    'piel': {'type': 'string', 'description': 'color hex #rrggbb'},
                    'pelo': {'type': 'string', 'description': 'color hex #rrggbb'},
                    'peinado': {'type': 'string', 'enum': PEINADOS},
                    'ropa': {'type': 'string', 'enum': ROPAS},
                    'colorRopa': {'type': 'string', 'description': 'color hex #rrggbb'},
                    'colorRopa2': {'type': 'string', 'description': 'color hex #rrggbb (detalles)'},
                    **{b: {'type': 'boolean'} for b in BOOL_PJ},
                },
            },
        },
        'escenas': {
            'type': 'array',
            'items': {
                'type': 'object', 'additionalProperties': False,
                'required': ['escenario', 'personajes', 'emocion', 'rotulo', 'frases'],
                'properties': {
                    'escenario': {'type': 'string', 'enum': list(ESCENARIOS)},
                    'personajes': {'type': 'array', 'items': {'type': 'string'}},
                    'emocion': {'type': 'string', 'enum': EMOCIONES},
                    'rotulo': {'type': 'string'},
                    'frases': {'type': 'array', 'items': {'type': 'string'}},
                },
            },
        },
        'publicacion': {
            'type': 'object', 'additionalProperties': False,
            'required': ['titulo', 'descripcion', 'hashtags'],
            'properties': {'titulo': {'type': 'string'}, 'descripcion': {'type': 'string'}, 'hashtags': {'type': 'array', 'items': {'type': 'string'}}},
        },
    },
}

INSTRUCCIONES = """Eres guionista de un canal de resúmenes de películas en español para YouTube Shorts, TikTok y Reels.
Escribes resúmenes originales con tus propias palabras (comentario y narración propios, nunca diálogos copiados de la película).

Cómo es un buen guion:
- 7 a 9 escenas y entre 170 y 230 palabras en total (unos 70–90 segundos de voz).
- La primera escena es un gancho de 1–2 frases que obliga a seguir mirando (una pregunta o una situación límite), no una ficha técnica.
- Cuenta la historia completa con su final, en orden, con frases cortas (máx. 18 palabras) fáciles de leer como subtítulo.
- Ritmo: cada escena avanza la trama; termina con una reflexión breve o un giro, y en la última frase invita a comentar qué película resumir después.
- Escribe los números con letras y evita siglas, símbolos y paréntesis: el texto lo lee una voz sintética.
- Escenarios: elige el más parecido de la lista; los personajes son ilustraciones sencillas, así que descríbelos con colores (#rrggbb), peinado y ropa de las opciones dadas.
- Máximo 2 personajes por escena y 2 a 5 personajes en el reparto. Los ids de `personajes` deben existir en `reparto`.
- `rotulo`: texto muy corto opcional en mayúsculas (lugar o momento, p. ej. "TRANSILVANIA" o "UN AÑO DESPUÉS"); cadena vacía si no hace falta.
- `tema`: filtro de color que encaje con el género (terror, noir, sepia para cine antiguo, neon para ciencia ficción, calido, frio…).
- `publicacion`: título con gancho (máx. 70 caracteres, sin destripar el final), descripción de 2–3 frases que diga que es un resumen con spoilers e incluya el título original y el año, y 8–12 hashtags sin #.
Si no conoces bien la película, no inventes: céntrate en lo que sabes con seguridad y mantén el resumen general."""


def generar_guion(titulo, anio=None, notas=''):
    try:
        import anthropic
    except ImportError:
        sys.exit('Falta el SDK de Anthropic:  pip install anthropic')
    client = anthropic.Anthropic()  # usa ANTHROPIC_API_KEY o el perfil de `ant auth login`
    escenarios = '\n'.join(f'- {k}: {v}' for k, v in ESCENARIOS.items())
    pedido = f'Película: {titulo}' + (f' ({anio})' if anio else '') + f'\n\nEscenarios disponibles:\n{escenarios}'
    if notas:
        pedido += f'\n\nIndicaciones extra: {notas}'
    resp = client.beta.messages.create(
        model='claude-opus-5-5',
        max_tokens=16000,
        betas=['server-side-fallback-2026-07-01'],
        fallbacks='default',
        output_config={'effort': 'medium', 'format': {'type': 'json_schema', 'schema': ESQUEMA}},
        system=INSTRUCCIONES,
        messages=[{'role': 'user', 'content': pedido}],
    )
    if resp.stop_reason == 'refusal':
        sys.exit(f'Claude no ha generado este guion ({getattr(resp.stop_details, "category", "")}). Prueba con otra película o escríbelo a mano.')
    if resp.stop_reason == 'max_tokens':
        sys.exit('La respuesta se cortó (max_tokens). Vuelve a intentarlo.')
    texto = next(b.text for b in resp.content if b.type == 'text')
    return json.loads(texto)


def cmd_nuevo(a):
    g = generar_guion(a.titulo, a.anio, a.notas or '')
    slug = a.slug or slugify(g['pelicula']['titulo'])
    errores = validar(g)
    r = rutas(slug)
    os.makedirs(r['dir'], exist_ok=True)
    with open(r['guion'], 'w', encoding='utf-8') as f:
        json.dump(g, f, ensure_ascii=False, indent=2)
    print(f'guion → {os.path.relpath(r["guion"], RAIZ)}')
    for e in errores:
        print('  ⚠', e)
    print('Revísalo (¡los datos de la película los inventa un modelo y pueden tener errores!) y luego:')
    print(f'  python3 tools/resumen.py todo {slug}')
    return slug


def cmd_plantilla(a):
    r = rutas(a.slug)
    if os.path.exists(r['guion']):
        sys.exit(f'ya existe {r["guion"]}')
    os.makedirs(r['dir'], exist_ok=True)
    g = {
        'pelicula': {'titulo': 'Título', 'anio': 2000, 'director': 'Director', 'genero': 'drama'},
        'tema': 'original',
        'reparto': [{'id': 'prota', 'nombre': 'Protagonista', 'piel': '#e8b896', 'pelo': '#2a1a12', 'peinado': 'corto', 'ropa': 'camiseta',
                     'colorRopa': '#3a6ad6', 'colorRopa2': '#ffffff', **{b: False for b in BOOL_PJ}}],
        'escenas': [{'escenario': 'ciudadNoche', 'personajes': ['prota'], 'emocion': 'tension', 'rotulo': '', 'frases': ['Frase gancho.', 'Segunda frase.']}],
        'publicacion': {'titulo': 'Título del vídeo', 'descripcion': 'Resumen con spoilers de…', 'hashtags': ['resumen', 'peliculas']},
    }
    with open(r['guion'], 'w', encoding='utf-8') as f:
        json.dump(g, f, ensure_ascii=False, indent=2)
    print(f'plantilla → {os.path.relpath(r["guion"], RAIZ)}')


def cmd_catalogo(_):
    print('ESCENARIOS'); [print(f'  {k:12s} {v}') for k, v in ESCENARIOS.items()]
    print('PEINADOS  ', ', '.join(PEINADOS)); print('ROPA      ', ', '.join(ROPAS))
    print('EMOCIONES ', ', '.join(EMOCIONES)); print('TEMAS     ', ', '.join(TEMAS))
    print('EXTRAS    ', ', '.join(BOOL_PJ), '(true/false)')


def cmd_validar(a):
    errores = validar(leer_guion(a.slug))
    print('\n'.join(errores) if errores else 'guion correcto')


# --------------------------------------------------------------------------- 2 · voz y música

VELOCIDAD = 0.97      # length_scale de Piper (<1 = más rápido; los Shorts piden ritmo vivo)
PAUSA_FRASE = 0.22
PAUSA_ESCENA = 0.45
INICIO = 0.5
COLA = 4.5            # imagen final con la llamada a seguir el canal


def asegurar_modelo():
    if os.path.exists(MODELO):
        return
    os.makedirs(VOCES, exist_ok=True)
    tgz = os.path.join(VOCES, 'voz.tar.gz')
    print('descargando voz Piper (es-mls_10246, CC BY 4.0)…')
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
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        return x


def escribir_mp3(x, ruta, sr=SR):
    tmp = ruta + '.wav'
    x = np.clip(x, -1, 1)
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-codec:a', 'libmp3lame', '-b:a', '160k', ruta], check=True)
    os.remove(tmp)


def sintetizar(texto, tmp):
    crudo, proc = tmp + '_raw.wav', tmp + '.wav'
    subprocess.run(
        ['python3', '-m', 'piper', '-m', MODELO, '-c', MODELO + '.json', '-f', crudo, '--length-scale', str(VELOCIDAD),
         '--noise-scale', '0.5', '--noise-w', '0.3', '--sentence-silence', '0'],
        input=texto.encode(), check=True, capture_output=True,
    )
    # cadena de locución: limpieza, presencia y compresión
    filtro = (f'aresample={SR}:resampler=soxr,highpass=f=85,lowpass=f=7800,equalizer=f=200:t=q:w=1:g=2,'
              'equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=140:makeup=4')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', crudo, '-af', filtro, '-ac', '1', proc], check=True)
    x = leer_wav(proc)
    os.remove(crudo); os.remove(proc)
    idx = np.where(np.abs(x) > 0.01)[0]
    if len(idx):
        x = x[max(0, idx[0] - 600):idx[-1] + 2600]
    return comprimir_silencios(x)


def comprimir_silencios(x, maximo=0.2, umbral_db=-42):
    """Acorta los silencios internos largos (Piper a veces deja pausas de varios segundos)."""
    v = int(0.01 * SR)
    n = len(x) // v
    if n < 3:
        return x
    rms = np.sqrt(np.mean(x[:n * v].reshape(n, v) ** 2, axis=1) + 1e-12)
    silencio = 20 * np.log10(rms) < umbral_db
    partes, i, maxv = [], 0, int(maximo / 0.01)
    while i < n:
        j = i
        while j < n and silencio[j] == silencio[i]:
            j += 1
        a, b = i * v, (j * v if j < n else len(x))
        if silencio[i] and j - i > maxv:
            m = maxv * v // 2
            seg = x[a:b]
            partes += [seg[:m] * np.linspace(1, 0, m), seg[-m:] * np.linspace(0, 1, m)]
        else:
            partes.append(x[a:b])
        i = j
    return np.concatenate(partes)


def repartir_palabras(texto, inicio, dur):
    """Tiempo de cada palabra, proporcional a su longitud (+ peso fijo por sílaba de arranque)."""
    ws = texto.split()
    pesos = [len(re.sub(r'\W', '', w)) + 2.5 + (2 if re.search(r'[,;:.!?…]$', w) else 0) for w in ws]
    total = sum(pesos)
    out, c = [], inicio
    for w, p in zip(ws, pesos):
        d = dur * p / total
        out.append({'w': w, 'inicio': round(c, 3), 'fin': round(c + d, 3)})
        c += d
    return out


ACORDES = {  # Hz de la nota base y progresión (semitonos) por estado de ánimo
    'terror': (55.0, [[0, 3, 7], [1, 4, 8], [0, 3, 6], [-2, 1, 5]]),
    'triste': (65.4, [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-2, 2, 5]]),
    'accion': (73.4, [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]]),
    'alegre': (65.4, [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]]),
}


def musica(genero, dur):
    """Fondo musical sintetizado (sin derechos de terceros): pad + bajo + pulso según el género."""
    g = genero.lower()
    clave = 'terror' if any(k in g for k in ('terror', 'suspense', 'thriller', 'misterio')) else \
            'accion' if any(k in g for k in ('acción', 'accion', 'aventura', 'ciencia', 'bélic', 'belic')) else \
            'alegre' if any(k in g for k in ('comedia', 'animación', 'animacion', 'familiar', 'musical')) else 'triste'
    base, prog = ACORDES[clave]
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    compas = 4.0 if clave != 'accion' else 2.4
    for k in range(int(dur / compas) + 1):
        a, b = int(k * compas * SR), min(n, int((k + 1) * compas * SR + SR))
        if a >= n:
            break
        tt = t[a:b] - k * compas
        env = np.minimum(1, tt / 1.2) * np.exp(-np.maximum(0, tt - compas) * 3)
        for st in prog[k % len(prog)]:
            fr = base * 2 * 2 ** (st / 12)
            out[a:b] += env * (np.sin(2 * np.pi * fr * tt) + 0.3 * np.sin(2 * np.pi * fr * 2.003 * tt)) * 0.12
        out[a:b] += env * np.sin(2 * np.pi * base * 2 ** (prog[k % len(prog)][0] / 12) * tt) * 0.25  # bajo
    # pulso: latido en terror, bombo en acción
    paso = {'terror': 1.6, 'accion': 0.6, 'alegre': 0.75, 'triste': 0}[clave]
    if paso:
        for c in np.arange(0.5, dur, paso):
            a = int(c * SR); m = min(n - a, int(0.4 * SR))
            tt = np.arange(m) / SR
            out[a:a + m] += np.sin(2 * np.pi * (48 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9) * 0.5
    trem = 1 + 0.15 * np.sin(2 * np.pi * 0.25 * t)
    out *= trem
    return out / (np.max(np.abs(out)) or 1) * 0.8


def cmd_narrar(a):
    r = rutas(a.slug)
    g = leer_guion(a.slug)
    errores = validar(g)
    if errores:
        sys.exit('Corrige el guion:\n  ' + '\n  '.join(errores))
    asegurar_modelo()
    os.makedirs(r['public'], exist_ok=True)
    tmp = os.path.join(r['public'], '_tmp')
    pistas, escenas, frases = [], [], []
    cursor = INICIO
    k = 0
    for i, e in enumerate(g['escenas']):
        ini = cursor - (INICIO if i == 0 else PAUSA_ESCENA / 2)
        for texto in e['frases']:
            x = sintetizar(texto, f'{tmp}{k}')
            k += 1
            d = len(x) / SR
            pistas.append((cursor, x))
            frases.append({'escena': i, 'texto': texto, 'inicio': round(cursor, 3), 'fin': round(cursor + d, 3), 'palabras': repartir_palabras(texto, cursor, d)})
            cursor += d + PAUSA_FRASE
            print(f'  escena {i + 1}  {d:5.2f} s  {texto[:60]}')
        cursor += PAUSA_ESCENA - PAUSA_FRASE
        escenas.append({'inicio': round(max(0, ini), 3)})
    total = cursor + COLA
    for i, e in enumerate(escenas):
        e['fin'] = escenas[i + 1]['inicio'] if i + 1 < len(escenas) else round(total, 3)
    voz = np.zeros(int(total * SR) + SR)
    for ini, x in pistas:
        s = int(ini * SR)
        voz[s:s + len(x)] += x
    voz = voz / (np.max(np.abs(voz)) or 1) * 0.92
    escribir_mp3(voz, os.path.join(r['public'], 'narracion.mp3'))
    escribir_mp3(musica(g['pelicula'].get('genero', ''), total + 1), os.path.join(r['public'], 'musica.mp3'))
    props = {'guion': g, 'tiempos': {'duracion': round(total, 3), 'escenas': escenas, 'frases': frases},
             'narracion': f'resumenes/{a.slug}/narracion.mp3', 'musica': f'resumenes/{a.slug}/musica.mp3'}
    with open(r['props'], 'w', encoding='utf-8') as f:
        json.dump(props, f, ensure_ascii=False, indent=1)
    print(f'duración {total:.1f} s → {os.path.relpath(r["props"], RAIZ)}')


# --------------------------------------------------------------------------- 3 · vídeo y publicación


def cmd_render(a):
    r = rutas(a.slug)
    if not os.path.exists(r['props']):
        cmd_narrar(a)
    os.makedirs(os.path.dirname(r['mp4']), exist_ok=True)
    cmd = ['npx', 'remotion', 'render', 'ResumenPelicula', r['mp4'], f'--props={r["props"]}', '--timeout=120000']
    if a.concurrencia:
        cmd.append(f'--concurrency={a.concurrencia}')
    subprocess.run(cmd, check=True, cwd=RAIZ)
    print(f'vídeo → {os.path.relpath(r["mp4"], RAIZ)}')


def cmd_publicar(a):
    r = rutas(a.slug)
    g = leer_guion(a.slug)
    p, pe = g['publicacion'], g['pelicula']
    tags = ' '.join('#' + re.sub(r'\W', '', h) for h in p['hashtags'])
    texto = (f"TÍTULO\n{p['titulo']}\n\nDESCRIPCIÓN\n{p['descripcion']}\n\n"
             f"Película: {pe['titulo']} ({pe['anio']}), dirigida por {pe['director']}.\n"
             'Resumen y comentario originales con ilustraciones propias. Contiene spoilers.\n\n'
             f'{tags}\n')
    os.makedirs(os.path.dirname(r['txt']), exist_ok=True)
    with open(r['txt'], 'w', encoding='utf-8') as f:
        f.write(texto)
    print(f'publicación → {os.path.relpath(r["txt"], RAIZ)}')


def cmd_todo(a):
    cmd_narrar(a)
    cmd_render(a)
    cmd_publicar(a)


def cmd_lote(a):
    with open(a.archivo, encoding='utf-8') as f:
        lineas = [l.strip() for l in f if l.strip() and not l.startswith('#')]
    for l in lineas:
        titulo, _, anio = l.partition('|')
        anio = int(anio) if anio.strip().isdigit() else None
        print(f'\n=== {titulo.strip()} ===')
        slug = slugify(titulo)
        if not os.path.exists(rutas(slug)['guion']):
            cmd_nuevo(argparse.Namespace(titulo=titulo.strip(), anio=anio, slug=slug, notas=None))
        if not a.solo_guiones:
            cmd_todo(argparse.Namespace(slug=slug, concurrencia=a.concurrencia))


def main():
    ap = argparse.ArgumentParser(description='Fábrica de resúmenes de películas en vídeo vertical')
    sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('nuevo', help='escribe el guion con Claude'); s.add_argument('titulo'); s.add_argument('--anio', type=int)
    s.add_argument('--slug'); s.add_argument('--notas', help='indicaciones extra para el guion'); s.set_defaults(f=cmd_nuevo)
    s = sub.add_parser('plantilla', help='guion vacío para rellenar a mano'); s.add_argument('slug'); s.set_defaults(f=cmd_plantilla)
    sub.add_parser('catalogo', help='opciones de escenarios, personajes…').set_defaults(f=cmd_catalogo)
    for n, fn in (('validar', cmd_validar), ('narrar', cmd_narrar), ('render', cmd_render), ('publicar', cmd_publicar), ('todo', cmd_todo)):
        s = sub.add_parser(n); s.add_argument('slug'); s.add_argument('--concurrencia', type=int); s.set_defaults(f=fn)
    s = sub.add_parser('lote', help='un vídeo por línea "Título | año"'); s.add_argument('archivo')
    s.add_argument('--solo-guiones', action='store_true'); s.add_argument('--concurrencia', type=int); s.set_defaults(f=cmd_lote)
    a = ap.parse_args()
    a.f(a)


if __name__ == '__main__':
    main()

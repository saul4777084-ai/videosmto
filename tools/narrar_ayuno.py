"""
Narración en español de "¿Qué sucede dentro de tu cuerpo si pasas 7 días sin comer?".

Sintetiza cada frase con Piper (voz es-mls_10246, CC BY 4.0, sin conexión), la procesa como
una locución de documental (ecualización, compresión, sala suave) y la coloca en la línea de
tiempo de su escena. Escribe:
    public/ayuno/narracion.wav            locución completa
    src/videos/ayuno/tiempos.json         inicio/fin de escenas, frases y subtítulos (segundos)

Uso:  python3 tools/narrar_ayuno.py
Si sustituyes la voz por una locución profesional, conserva las frases y vuelve a medir los
tiempos (o ajusta tiempos.json a mano).
"""
import json
import os
import subprocess
import tarfile
import urllib.request
import wave

import numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
VOCES = os.path.join(RAIZ, 'tools', 'voces')
MODELO = os.path.join(VOCES, 'es-mls_10246-low.onnx')
URL_MODELO = 'https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-mls_10246-low.tar.gz'
SALIDA = os.path.join(RAIZ, 'public', 'ayuno')
TMP = os.path.join(SALIDA, 'voz')
SR = 48000

# Escenas: (id, inicio mínimo en s, frases). El inicio real se retrasa si la escena anterior
# todavía está hablando. Cada frase lleva pausa propia después (s).
ESCENAS = [
    ('intro', 0.0, [
        ('¿Alguna vez te has preguntado qué pasaría dentro de tu cuerpo si dejaras de comer durante siete días?', 0.45),
        ('Tu organismo comenzaría a cambiar desde las primeras horas.', 0.0),
    ]),
    ('dia1', 9.0, [
        ('Durante las primeras horas, tu cuerpo sigue utilizando la energía de los alimentos anteriores.', 0.45),
        ('Después comienza a recurrir a sus reservas de glucógeno, especialmente las almacenadas en el hígado.', 0.0),
    ]),
    ('dia2', 23.0, [
        ('Alrededor del segundo día, las reservas de glucógeno disminuyen considerablemente.', 0.45),
        ('Tu organismo comienza a depender más de la grasa almacenada para obtener energía.', 0.0),
    ]),
    ('dia3', 36.0, [
        ('El hígado aumenta la producción de cuerpos cetónicos.', 0.4),
        ('Tu cerebro comienza a utilizarlos como una fuente alternativa de energía, mientras el organismo intenta conservar sus recursos.', 0.0),
    ]),
    ('dia45', 50.0, [
        ('Con el paso de los días, el cuerpo sigue movilizando grasa, pero también utiliza proteínas.', 0.45),
        ('Pueden aparecer debilidad, mareos, deshidratación y alteraciones de electrolitos.', 0.0),
    ]),
    ('dia67', 66.0, [
        ('Al séptimo día, el organismo se encuentra bajo un estrés importante.', 0.4),
        ('La falta de nutrientes y los desequilibrios pueden comprometer órganos vitales.', 0.4),
        ('No existe una respuesta igual para todas las personas.', 0.0),
    ]),
    ('cierre', 81.0, [
        ('El cuerpo humano puede adaptarse a la falta de alimentos, pero eso no significa que sea seguro.', 0.45),
        ('Siete días sin comer pueden representar un riesgo grave para tu salud.', 0.0),
    ]),
]
RETARDO_INICIO = 0.6   # silencio antes de la primera palabra de cada escena
COLA_ESCENA = 0.9      # imagen que queda después de la última palabra
COLA_FINAL = 3.2       # silencio al final del vídeo
VELOCIDAD = 1.08       # length_scale de Piper (>1 = más lento)
RUIDO = ('0.5', '0.25')  # noise_scale y noise_w: valores bajos = ritmo estable, sin pausas raras


def asegurar_modelo():
    if os.path.exists(MODELO):
        return
    os.makedirs(VOCES, exist_ok=True)
    tgz = os.path.join(VOCES, 'voz.tar.gz')
    print('descargando voz Piper…')
    urllib.request.urlretrieve(URL_MODELO, tgz)
    with tarfile.open(tgz) as t:
        for m in t.getmembers():
            if m.isfile():
                m.name = os.path.basename(m.name)
                t.extract(m, VOCES)
    os.remove(tgz)


def leer_wav(ruta):
    with wave.open(ruta) as w:
        n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float64) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        return x, w.getframerate()


def recortar(x, umbral=0.01):
    """Quita el silencio del principio y del final."""
    idx = np.where(np.abs(x) > umbral)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * SR))
    b = min(len(x), idx[-1] + int(0.06 * SR))
    return x[a:b]


def sintetizar(texto, i):
    crudo = os.path.join(TMP, f'f{i:02d}_raw.wav')
    proc = os.path.join(TMP, f'f{i:02d}.wav')
    subprocess.run(
        ['python3', '-m', 'piper', '-m', MODELO, '-c', MODELO + '.json', '-f', crudo, '--length-scale', str(VELOCIDAD), '--noise-scale', RUIDO[0], '--noise-w', RUIDO[1], '--sentence-silence', '0'],
        input=texto.encode(), check=True, capture_output=True,
    )
    # cadena de locución: remuestreo, limpieza de graves, presencia, compresión y un poco de sala
    filtro = (
        f'aresample={SR}:resampler=soxr,highpass=f=85,lowpass=f=7600,'
        'equalizer=f=180:t=q:w=1.0:g=2.5,equalizer=f=3200:t=q:w=1.2:g=3,equalizer=f=6500:t=q:w=1:g=-2,'
        'acompressor=threshold=-20dB:ratio=3.5:attack=8:release=140:makeup=4,'
        'aecho=0.85:0.5:38|61:0.11|0.07'
    )
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', crudo, '-af', filtro, '-ac', '1', proc], check=True)
    x, _ = leer_wav(proc)
    os.remove(crudo)
    os.remove(proc)
    return recortar(x)


DEBILES = {'de', 'del', 'la', 'el', 'los', 'las', 'a', 'y', 'e', 'que', 'en', 'con', 'por', 'para', 'su', 'sus', 'un', 'una', 'tu', 'se', 'no', 'lo', 'al', 'como', 'pero', 'más', 'mientras'}


def trocear(texto, n_max=7):
    """Divide una frase en líneas de subtítulo cortas, respetando las comas y sin dejar
    palabras como "de" o "la" al final de una línea."""
    trozos, actual = [], []
    for p in texto.split():
        actual.append(p)
        corte = len(actual) >= n_max or (p.endswith((',', ';')) and len(actual) >= 3)
        if corte and p.lower().strip(',;.') in DEBILES and len(actual) < n_max + 2:
            corte = False
        if corte:
            trozos.append(' '.join(actual))
            actual = []
    if actual:
        if trozos and len(actual) <= 2:
            trozos[-1] += ' ' + ' '.join(actual)
        else:
            trozos.append(' '.join(actual))
    return trozos


def main():
    asegurar_modelo()
    os.makedirs(TMP, exist_ok=True)
    pistas = []
    escenas = []
    subs = []
    frases_json = []
    t = 0.0
    k = 0
    for idx, (eid, inicio_min, frases) in enumerate(ESCENAS):
        inicio = max(inicio_min, t)
        cursor = inicio + RETARDO_INICIO
        for texto, pausa in frases:
            x = sintetizar(texto, k)
            k += 1
            dur = len(x) / SR
            pistas.append((cursor, x))
            frases_json.append({'escena': eid, 'texto': texto, 'inicio': round(cursor, 3), 'fin': round(cursor + dur, 3)})
            # subtítulos repartidos por número de letras
            lineas = trocear(texto)
            letras = sum(len(l) for l in lineas)
            c = cursor
            for l in lineas:
                d = dur * len(l) / letras
                subs.append({'texto': l, 'inicio': round(c, 3), 'fin': round(c + d, 3)})
                c += d
            cursor += dur + pausa
        t = cursor + COLA_ESCENA
        escenas.append({'id': eid, 'inicio': round(inicio, 3)})
    total = t + COLA_FINAL - COLA_ESCENA
    for i, e in enumerate(escenas):
        e['fin'] = escenas[i + 1]['inicio'] if i + 1 < len(escenas) else round(total, 3)

    voz = np.zeros(int(total * SR) + SR)
    for inicio, x in pistas:
        a = int(inicio * SR)
        voz[a:a + len(x)] += x
    voz = voz / (np.max(np.abs(voz)) or 1) * 0.9
    ruta = os.path.join(SALIDA, 'narracion.wav')
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((voz * 32767).astype('<i2').tobytes())
    datos = {'duracion': round(total, 3), 'escenas': escenas, 'frases': frases_json, 'subtitulos': subs}
    with open(os.path.join(RAIZ, 'src', 'videos', 'ayuno', 'tiempos.json'), 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
    for e in escenas:
        print(f"{e['id']:7s} {e['inicio']:6.2f} → {e['fin']:6.2f}")
    print('duración total', round(total, 2), 's')


if __name__ == '__main__':
    main()

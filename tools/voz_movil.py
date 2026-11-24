"""
Encaja una locución grabada (p. ej. de ElevenLabs) en el vídeo "Móvil 8 horas".

1. Transcribe tu audio con faster-whisper (marcas de tiempo por palabra) y localiza cada frase del
   guion (tools/tiempos_movil.py), afinando cada corte con la energía de la señal.
2. Guarda src/videos/movil/voz.json con la duración real de cada frase y el instante de cada palabra.
3. Vuelve a calcular los tiempos del vídeo con esas duraciones (tiempos_movil.py): escenas,
   subtítulos palabra a palabra, textos y .srt quedan sincronizados con TU voz.
4. Monta public/movil/voz.wav: cada frase de tu audio colocada en su segundo del vídeo.

Uso:  python3 tools/voz_movil.py tu_audio.mp3
Después: tools/render_movil.sh (imagen) y python3 tools/sintetizar_movil.py (música, efectos y voz).
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata
import wave

import numpy as np

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(RAIZ, 'tools'))
import tiempos_movil as tiempos_cola  # noqa: E402

SR = 48000
NUM = {'uno': '1', 'dos': '2', 'siete': '7', 'ocho': '8', 'quince': '15', 'treinta': '30'}


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    w = ''.join(c for c in w if unicodedata.category(c) != 'Mn')
    w = re.sub(r'[^a-z0-9]', '', w)
    return NUM.get(w, w)


def leer(ruta, sr):
    crudo = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', ruta, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], check=True, capture_output=True).stdout
    return np.frombuffer(crudo, '<i2').astype(np.float32) / 32768


def transcribir(ruta, cache):
    if os.path.exists(cache) and os.path.getmtime(cache) > os.path.getmtime(ruta):
        return json.load(open(cache, encoding='utf-8'))
    from faster_whisper import WhisperModel
    x = leer(ruta, 16000)
    m = WhisperModel('small', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(x, language='es', word_timestamps=True, vad_filter=False, beam_size=5)
    palabras = [[w.start, w.end, w.word.strip()] for s in segs for w in s.words]
    json.dump(palabras, open(cache, 'w', encoding='utf-8'), ensure_ascii=False)
    return palabras


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    ruta = sys.argv[1]
    os.makedirs(os.path.join(RAIZ, 'public', 'movil'), exist_ok=True)
    palabras = transcribir(ruta, os.path.join(RAIZ, 'public', 'movil', 'voz_palabras.json'))

    # palabras del guion (frase a frase) — "Coca-Cola" se trocea igual que en la transcripción
    frases = [x for _, _, _, fr in tiempos_cola.ESCENAS for x in fr]
    guion = []  # (frase, índice de palabra en la frase, token normalizado)
    for k, (texto, _, _) in enumerate(frases):
        for j, w in enumerate(texto.split()):
            for parte in [p for p in re.split(r'-', w) if norm(p)]:
                guion.append((k, j, norm(parte)))
    trans = []
    for i, (_, _, w) in enumerate(palabras):
        for parte in [p for p in re.split(r'-', w) if norm(p)]:
            trans.append((i, norm(parte)))
    sm = difflib.SequenceMatcher(a=[g[2] for g in guion], b=[t[1] for t in trans], autojunk=False)
    mapa = {}  # (frase, palabra) -> (inicio, fin) en tu audio
    for a, b, n in sm.get_matching_blocks():
        for d in range(n):
            k, j, _ = guion[a + d]
            i = trans[b + d][0]
            ini, fin = palabras[i][0], palabras[i][1]
            if (k, j) in mapa:
                ini = min(ini, mapa[(k, j)][0])
                fin = max(fin, mapa[(k, j)][1])
            mapa[(k, j)] = (ini, fin)
    acierto = len(mapa) / sum(len(f[0].split()) for f in frases)
    print(f'palabras del guion encontradas en tu audio: {acierto:.0%}')

    # energía para afinar los cortes (ventanas de 10 ms)
    x = leer(ruta, SR)
    h = SR // 100
    db = 20 * np.log10(np.sqrt(np.convolve(x.astype(np.float64) ** 2, np.ones(h) / h, 'same')[::h]) + 1e-9)
    voz = db > -42

    cortes = []
    for k, (texto, _, _) in enumerate(frases):
        n = len(texto.split())
        js = [j for j in range(n) if (k, j) in mapa]
        if not js:
            raise SystemExit(f'No encuentro la frase {k + 1} en tu audio: "{texto}"')
        a = mapa[(k, js[0])][0]
        b = mapa[(k, js[-1])][1]
        # inicio: retrocede hasta el silencio previo (sin pisar la frase anterior)
        i = int(a * 100)
        lim = int(cortes[-1]['b'] * 100) if cortes else 0
        if i <= lim:  # la transcripción la pega a la frase anterior: busca dónde vuelve a sonar la voz
            i = lim + 1
            while i < len(voz) - 1 and not voz[i]:
                i += 1
        while i > lim and voz[max(0, i - 1)]:
            i -= 1
        # fin: avanza hasta 0,2 s de silencio seguido, sin pasar del comienzo de la frase siguiente;
        # si la voz apenas hace pausa, corta en el punto más silencioso antes de la siguiente frase
        sig = None
        if k + 1 < len(frases):
            js2 = [j2 for j2 in range(len(frases[k + 1][0].split())) if (k + 1, j2) in mapa]
            if js2:
                sig = mapa[(k + 1, js2[0])][0]
        tope = len(voz) - 20 if sig is None else min(len(voz) - 20, int(sig * 100))
        j = int(b * 100)
        while j < tope and voz[j:j + 20].any():
            j += 1
        if sig is not None and j >= tope:
            v0, v1 = max(int(b * 100) - 15, 0), min(int(sig * 100) + 15, len(db))
            j = v0 + int(np.argmin(db[v0:v1])) if v1 > v0 else int(b * 100)
        ini, fin = max(0, i / 100 - 0.03), min(len(x) / SR, j / 100 + 0.06)
        # instante (relativo al inicio de la frase) de cada palabra; las que falten se interpolan
        tps = []
        for jj in range(n):
            if (k, jj) in mapa:
                tps.append(mapa[(k, jj)][0] - ini)
            else:
                tps.append(None)
        conocidos = [(jj, v) for jj, v in enumerate(tps) if v is not None]
        for jj in range(n):
            if tps[jj] is None:
                ant = max((c for c in conocidos if c[0] < jj), default=(0, 0.0), key=lambda c: c[0])
                sig = min((c for c in conocidos if c[0] > jj), default=(n, fin - ini), key=lambda c: c[0])
                tps[jj] = ant[1] + (sig[1] - ant[1]) * (jj - ant[0]) / max(1, sig[0] - ant[0])
        tps[0] = max(0.0, min(tps[0], 0.05))
        cortes.append({'texto': texto, 'a': round(ini, 3), 'b': round(fin, 3), 'dur': round(fin - ini, 3), 'palabras': [round(max(0, v), 3) for v in tps]})
        print(f'{k + 1:2d}  {ini:6.2f}-{fin:6.2f}  ({fin - ini:4.2f} s)  {texto[:60]}')

    json.dump({'audio': os.path.basename(ruta), 'frases': cortes}, open(os.path.join(RAIZ, 'src', 'videos', 'movil', 'voz.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    # tiempos del vídeo con las duraciones reales
    tiempos_cola.main()
    T = json.load(open(os.path.join(RAIZ, 'src', 'videos', 'movil', 'tiempos.json'), encoding='utf-8'))

    # montaje de la voz en su sitio
    salida = np.zeros(int((T['duracion'] + 1) * SR), dtype=np.float64)
    fade = int(0.012 * SR)
    for c, f in zip(cortes, T['frases']):
        seg = x[int(c['a'] * SR):int(c['b'] * SR)].astype(np.float64).copy()
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        p = int(f['inicio'] * SR)
        salida[p:p + len(seg)] += seg[: len(salida) - p]
    salida = salida[: int(T['duracion'] * SR)]
    with wave.open(os.path.join(RAIZ, 'public', 'movil', 'voz.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(salida, -1, 1) * 32767).astype('<i2').tobytes())
    print('voz montada: public/movil/voz.wav')


if __name__ == '__main__':
    main()

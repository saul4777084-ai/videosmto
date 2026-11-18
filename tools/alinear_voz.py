"""
Alinea una locución externa (p. ej. generada en ElevenLabs) con el vídeo "7 días sin comer".

1. Sintetiza cada frase del guion con Piper como referencia (duraciones conocidas).
2. Compara tu audio con la referencia mediante DTW sobre coeficientes MFCC para saber dónde
   empieza y acaba cada frase en tu audio, y ajusta cada corte al silencio más cercano.
3. Coloca cada frase de tu audio en el segundo en que esa frase aparece en el vídeo
   (tiempos.json), de modo que coincide con los subtítulos, los indicadores de día y las escenas.

Uso:  python3 tools/alinear_voz.py tu_audio.mp3 salida.wav
Escribe además salida.json con los cortes encontrados.
"""
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from numba import njit
from scipy.fft import dct
from scipy.signal import stft

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODELO = os.path.join(RAIZ, 'tools', 'voces', 'es-mls_10246-low.onnx')
SR = 16000
HOP = 0.01


def leer(ruta, sr=SR):
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', ruta, '-ac', '1', '-ar', str(sr), f.name], check=True)
        with wave.open(f.name) as w:
            return np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768


def mfcc(x):
    n = int(0.025 * SR)
    h = int(HOP * SR)
    _, _, Z = stft(x, SR, nperseg=n, noverlap=n - h, nfft=512, boundary=None, padded=False)
    P = np.abs(Z) ** 2
    # banco de filtros mel
    fmel = lambda f: 2595 * np.log10(1 + f / 700)
    imel = lambda m: 700 * (10 ** (m / 2595) - 1)
    pts = imel(np.linspace(fmel(80), fmel(7600), 42))
    bins = np.floor((512 + 1) * pts / SR).astype(int)
    fb = np.zeros((40, P.shape[0]))
    for i in range(40):
        a, b, c = bins[i], bins[i + 1], bins[i + 2]
        fb[i, a:b] = (np.arange(a, b) - a) / max(1, b - a)
        fb[i, b:c] = (c - np.arange(b, c)) / max(1, c - b)
    E = np.log(fb @ P + 1e-9)
    C = dct(E, axis=0, norm='ortho')[1:14].T
    # normalización por media y varianza (quita diferencias de voz y micrófono)
    C = (C - C.mean(0)) / (C.std(0) + 1e-9)
    # derivadas
    D = np.gradient(C, axis=0)
    return np.hstack([C, D * 0.5])


@njit(cache=True)
def dtw(A, B, banda):
    n, m = A.shape[0], B.shape[0]
    INF = 1e18
    D = np.full((n + 1, m + 1), INF)
    D[0, 0] = 0.0
    for i in range(1, n + 1):
        c = int(i * m / n)
        lo = max(1, c - banda)
        hi = min(m, c + banda)
        for j in range(lo, hi + 1):
            d = 0.0
            for k in range(A.shape[1]):
                t = A[i - 1, k] - B[j - 1, k]
                d += t * t
            d = np.sqrt(d)
            D[i, j] = d + min(D[i - 1, j], D[i - 1, j - 1], D[i, j - 1])
    # camino de vuelta
    i, j = n, m
    camino = np.zeros(n + 1, dtype=np.int64)
    while i > 0 and j > 0:
        camino[i] = j
        a, b, c = D[i - 1, j - 1], D[i - 1, j], D[i, j - 1]
        if a <= b and a <= c:
            i -= 1
            j -= 1
        elif b <= c:
            i -= 1
        else:
            j -= 1
    return camino


def silencios(x, umbral=0.012, minimo=0.08):
    h = int(HOP * SR)
    e = np.array([np.sqrt(np.mean(x[i:i + h] ** 2)) for i in range(0, len(x) - h, h)])
    sil = e < umbral
    r, i = [], 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]:
                j += 1
            if (j - i) * HOP >= minimo:
                r.append((i * HOP, j * HOP))
            i = j
        else:
            i += 1
    return r, e


def main():
    entrada, salida = sys.argv[1], sys.argv[2]
    T = json.load(open(os.path.join(RAIZ, 'src/videos/ayuno/tiempos.json'), encoding='utf-8'))
    frases = [f['texto'] for f in T['frases']]
    # referencia Piper frase a frase
    ref, cortes_ref = [], []
    t = 0.0
    for texto in frases:
        with tempfile.NamedTemporaryFile(suffix='.wav') as f:
            subprocess.run(['python3', '-m', 'piper', '-m', MODELO, '-c', MODELO + '.json', '-f', f.name, '--noise-scale', '0.5', '--noise-w', '0.25'], input=texto.encode(), check=True, capture_output=True)
            x = leer(f.name)
        idx = np.where(np.abs(x) > 0.01)[0]
        x = x[idx[0]:idx[-1]]
        cortes_ref.append((t, t + len(x) / SR))
        ref.append(x)
        ref.append(np.zeros(int(0.3 * SR)))
        t += len(x) / SR + 0.3
    R = np.concatenate(ref)
    U = leer(entrada)
    A, B = mfcc(R), mfcc(U)
    camino = dtw(A, B, int(max(A.shape[0], B.shape[0]) * 0.15))
    a_u = lambda s: camino[min(len(camino) - 1, max(1, int(s / HOP)))] * HOP
    sil, _ = silencios(U)
    idxv = np.where(np.abs(U) > 0.02)[0]
    ini_voz, fin_voz = idxv[0] / SR, idxv[-1] / SR
    # fronteras entre frases: punto medio entre fin de una y comienzo de la siguiente, ajustado al silencio
    fronteras = []
    for k in range(len(frases) - 1):
        e = (a_u(cortes_ref[k][1]) + a_u(cortes_ref[k + 1][0])) / 2
        cand = [s for s in sil if abs((s[0] + s[1]) / 2 - e) < 1.2]
        if cand:
            s = min(cand, key=lambda s: abs((s[0] + s[1]) / 2 - e) - (s[1] - s[0]) * 0.8)
            fronteras.append(s)
        else:
            fronteras.append((e, e))
    seg = []
    for k in range(len(frases)):
        a = ini_voz if k == 0 else fronteras[k - 1][1]
        b = fin_voz if k == len(frases) - 1 else fronteras[k][0]
        seg.append((max(0.0, a - 0.03), b + 0.06))
    # montaje: cada frase en su segundo del vídeo
    SR2 = 48000
    U2 = leer(entrada, SR2)
    total = T['duracion']
    out = np.zeros(int(total * SR2) + SR2)
    info = []
    for k, (a, b) in enumerate(seg):
        x = U2[int(a * SR2):int(b * SR2)].copy()
        f = int(0.01 * SR2)
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
        dest = T['frases'][k]['inicio']
        limite = T['frases'][k + 1]['inicio'] - 0.1 if k + 1 < len(frases) else total
        if dest + len(x) / SR2 > limite:
            dest = max(dest - (dest + len(x) / SR2 - limite), (T['frases'][k - 1]['fin'] if k else 0))
        i0 = int(dest * SR2)
        out[i0:i0 + len(x)] += x
        info.append({'frase': frases[k], 'en_tu_audio': [round(a, 2), round(b, 2)], 'en_el_video': [round(dest, 2), round(dest + len(x) / SR2, 2)], 'video_original': [T['frases'][k]['inicio'], T['frases'][k]['fin']]})
    out = out[: int(total * SR2)]
    with wave.open(salida, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR2)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
    json.dump(info, open(os.path.splitext(salida)[0] + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for i in info:
        print(f"{i['en_tu_audio'][0]:6.2f}-{i['en_tu_audio'][1]:6.2f} → {i['en_el_video'][0]:6.2f}-{i['en_el_video'][1]:6.2f} (orig {i['video_original'][0]:6.2f}-{i['video_original'][1]:6.2f})  {i['frase'][:42]}")


if __name__ == '__main__':
    main()

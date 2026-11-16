"""
Banda sonora y efectos de "¿Qué sucede dentro de tu cuerpo si pasas 7 días sin comer?".

Todo se sintetiza con numpy/scipy (sin muestras externas) y se sincroniza con los tiempos de
la narración (src/videos/ayuno/tiempos.json) y el plan de tomas (src/videos/ayuno/plan.json).
Escribe public/ayuno/banda.wav (música + efectos, estéreo, 48 kHz) con la música atenuada
automáticamente bajo la voz.

Uso:  python3 tools/sintetizar_ayuno.py   (después de tools/narrar_ayuno.py)
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfiltfilt

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SR = 48000
rng = np.random.default_rng(11)

T = json.load(open(os.path.join(RAIZ, 'src/videos/ayuno/tiempos.json'), encoding='utf-8'))
PLAN = json.load(open(os.path.join(RAIZ, 'src/videos/ayuno/plan.json'), encoding='utf-8'))
DUR = T['duracion']
N = int(DUR * SR)
t = np.arange(N) / SR
ESC = {e['id']: e for e in T['escenas']}


def tomas():
    """Lista (escena, toma, inicio_abs, fin_abs)."""
    r = []
    for e in T['escenas']:
        lista = PLAN['escenas'][e['id']]
        for i, x in enumerate(lista):
            a = e['inicio'] + x['t']
            b = e['inicio'] + lista[i + 1]['t'] if i + 1 < len(lista) else e['fin']
            r.append((e['id'], x['toma'], a, b))
    return r


TOMAS = tomas()


def lp(x, f, orden=2):
    return sosfilt(butter(orden, f / (SR / 2), 'low', output='sos'), x)


def hp(x, f, orden=2):
    return sosfilt(butter(orden, f / (SR / 2), 'high', output='sos'), x)


def bp(x, f1, f2, orden=2):
    return sosfilt(butter(orden, [f1 / (SR / 2), f2 / (SR / 2)], 'band', output='sos'), x)


def tramo(a, b, fi=1.5, fo=1.5):
    return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)


def nota(n):
    """Número MIDI → Hz."""
    return 440.0 * 2 ** ((n - 69) / 12)


def sierra_suave(f, dur_t, armonicos=10, detune=0.0):
    x = np.zeros_like(dur_t)
    for k in range(1, armonicos + 1):
        x += np.sin(2 * np.pi * f * k * (1 + detune) * dur_t + k * 1.3) / k
    return x


def colocar(dest, x, inicio, gan=1.0):
    a = int(inicio * SR)
    if a >= len(dest):
        return
    b = min(len(dest), a + len(x))
    dest[a:b] += x[: b - a] * gan


# ------------------------------------------------------------------------------------ música
izq = np.zeros(N)
der = np.zeros(N)

# dron grave continuo (La) con respiración lenta
dron = (np.sin(2 * np.pi * 55 * t) * 0.6 + np.sin(2 * np.pi * 82.41 * t + 0.4) * 0.3 + np.sin(2 * np.pi * 110.3 * t) * 0.15)
dron *= 0.75 + 0.25 * np.sin(2 * np.pi * t / 9.0)
dron *= np.clip(t / 3, 0, 1)
izq += dron * 0.32
der += dron * 0.32

# acordes por escena (MIDI): la tensión crece día a día y se resuelve al final
ACORDES = {
    'intro': [45, 57, 60, 64, 71],         # Lam(add9)
    'dia1': [41, 53, 57, 60, 67],          # Fa(add9)
    'dia2': [38, 50, 53, 57, 64],          # Rem(add9)
    'dia3': [46, 53, 58, 62, 65],          # Sib
    'dia45': [43, 50, 55, 58, 63],         # Solm(b6)
    'dia67': [40, 52, 55, 58, 61, 65],     # cluster tenso
    'cierre': [41, 53, 57, 60, 64, 69],    # Famaj7 → luz
}
pad_i = np.zeros(N)
pad_d = np.zeros(N)
for e in T['escenas']:
    a, b = e['inicio'], e['fin']
    env = tramo(a - 1.2, b + 1.2, 2.2, 2.2)
    if e['id'] == 'cierre':
        env = tramo(a - 1.2, DUR - 0.3, 2.2, 4.0)
    sel = env > 0
    for k, n in enumerate(ACORDES[e['id']]):
        f = nota(n)
        g = 0.22 / (1 + k * 0.25)
        pad_i[sel] += sierra_suave(f, t[sel], 8, -0.0035) * g * env[sel]
        pad_d[sel] += sierra_suave(f, t[sel], 8, 0.0035) * g * env[sel]
# filtro que se abre poco a poco en cada escena
pad_i = lp(pad_i, 900) * 0.8 + lp(pad_i, 2400) * 0.2
pad_d = lp(pad_d, 900) * 0.8 + lp(pad_d, 2400) * 0.2
izq += pad_i * 0.5
der += pad_d * 0.5

# brillo agudo (cristales) en las tomas microscópicas
micro = {'vasoGlucosa', 'hepatocitos', 'adipocitos', 'vasoGrasa', 'mitocondria', 'neuronas', 'fibras', 'electrolitos'}
for (_, toma, a, b) in TOMAS:
    if toma not in micro:
        continue
    n_notas = int((b - a) * 3)
    escala = [76, 79, 81, 83, 86, 88, 91]
    for i in range(n_notas):
        ti = a + i / 3 + rng.uniform(0, 0.12)
        f = nota(escala[rng.integers(len(escala))])
        d = np.arange(int(1.6 * SR)) / SR
        x = np.sin(2 * np.pi * f * d) * np.exp(-d * 3.2) * (1 - np.exp(-d * 200)) * 0.06
        pan = rng.uniform(0.2, 0.8)
        colocar(izq, x, ti, 1 - pan)
        colocar(der, x, ti, pan)

# pulso grave que acompaña desde el día 4 (inquietud creciente)
for e in ('dia45', 'dia67'):
    a, b = ESC[e]['inicio'], ESC[e]['fin']
    periodo = 0.92 if e == 'dia67' else 1.1
    k = a
    while k < b - 0.3:
        d = np.arange(int(0.5 * SR)) / SR
        x = np.sin(2 * np.pi * (48 + 30 * np.exp(-d * 25)) * d) * np.exp(-d * 9) * 0.35
        colocar(izq, x, k)
        colocar(der, x, k)
        k += periodo

# ------------------------------------------------------------------------------------ efectos
fx_i = np.zeros(N)
fx_d = np.zeros(N)


def whoosh(dur=1.1, subida=True):
    d = np.arange(int(dur * SR)) / SR
    ruido = rng.standard_normal(len(d))
    p = d / dur
    env = np.sin(np.pi * p) ** 2
    # barrido de filtro por bloques
    out = np.zeros_like(ruido)
    bloques = 24
    for i in range(bloques):
        s = slice(i * len(d) // bloques, (i + 1) * len(d) // bloques)
        q = (i + 0.5) / bloques
        fc = 300 + 4200 * (q if subida else 1 - q) ** 1.5
        out[s] = bp(ruido, fc * 0.6, min(fc * 1.6, 20000))[s]
    return out * env * 0.5


def latido():
    d = np.arange(int(0.6 * SR)) / SR
    golpe = lambda a, f, g: np.where(d >= a, np.sin(2 * np.pi * f * (d - a)) * np.exp(-(d - a) * 18) * g, 0)
    return golpe(0, 55, 1.0) + golpe(0.0, 110, 0.25) + golpe(0.24, 48, 0.7)


def boom():
    d = np.arange(int(2.5 * SR)) / SR
    return np.sin(2 * np.pi * (32 + 60 * np.exp(-d * 6)) * d) * np.exp(-d * 1.8) * 0.9


def ding():
    d = np.arange(int(1.4 * SR)) / SR
    return (np.sin(2 * np.pi * 1318 * d) + 0.5 * np.sin(2 * np.pi * 1976 * d) + 0.25 * np.sin(2 * np.pi * 2637 * d)) * np.exp(-d * 4) * 0.18


def burbuja():
    d = np.arange(int(0.25 * SR)) / SR
    f = rng.uniform(500, 1100)
    return np.sin(2 * np.pi * (f + 900 * d) * d) * np.exp(-d * 22) * 0.12


def alerta():
    d = np.arange(int(0.8 * SR)) / SR
    return np.sin(2 * np.pi * 220 * d) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * d)) * np.exp(-d * 3) * 0.12


# transiciones entre escenas y entre tomas
for i, (esc, toma, a, b) in enumerate(TOMAS):
    if i == 0:
        continue
    nueva_escena = TOMAS[i - 1][0] != esc
    w = whoosh(1.3 if nueva_escena else 0.9, subida=i % 2 == 0)
    colocar(fx_i, w, a - (0.8 if nueva_escena else 0.55), 0.9)
    colocar(fx_d, w[::-1] * 0 + w, a - (0.8 if nueva_escena else 0.55), 0.7)
    if nueva_escena:
        colocar(fx_i, boom(), a, 0.55)
        colocar(fx_d, boom(), a, 0.55)
        if esc != 'cierre':
            colocar(fx_i, ding(), a + 0.35, 0.9)
            colocar(fx_d, ding(), a + 0.38, 0.9)

# latidos en las tomas del corazón y del cuerpo completo
P = PLAN['latido']
for (esc, toma, a, b) in TOMAS:
    if toma in ('cuerpoIntro', 'corazon', 'cuerpoCierre'):
        g = 0.55 if toma == 'corazon' else 0.32
        k = a + 0.4
        while k < b - 0.2:
            colocar(fx_i, latido(), k, g)
            colocar(fx_d, latido(), k, g)
            k += P
    if toma in micro:
        k = a
        while k < b:
            x = burbuja()
            pan = rng.uniform(0, 1)
            colocar(fx_i, x, k, 1 - pan)
            colocar(fx_d, x, k, pan)
            k += rng.uniform(0.18, 0.45)
    if toma in ('cerebroAlerta', 'rinones', 'cuerpoRecorrido'):
        k = a + 0.5
        while k < b - 0.5:
            colocar(fx_i, alerta(), k)
            colocar(fx_d, alerta(), k)
            k += 1.6

# respiración suave en la introducción (pulmones)
a, b = ESC['intro']['inicio'], ESC['intro']['fin']
aire = bp(rng.standard_normal(N), 300, 1800) * (0.5 - 0.5 * np.cos(2 * np.pi * t / PLAN['respiracion'])) * tramo(a + 2, b, 1.5, 1.5) * 0.05
fx_i += aire
fx_d += aire

# ------------------------------------------------------------------------------------ mezcla
def reverb(x, seg=3.2, semilla=0):
    r = np.random.default_rng(semilla)
    d = np.arange(int(seg * SR)) / SR
    ir = r.standard_normal(len(d)) * np.exp(-d * 6.9 / seg)
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    return fftconvolve(x, ir)[: len(x)]


mus_i = izq + reverb(izq, 3.5, 1) * 0.55
mus_d = der + reverb(der, 3.5, 2) * 0.55
efx_i = fx_i + reverb(fx_i, 2.0, 3) * 0.3
efx_d = fx_d + reverb(fx_d, 2.0, 4) * 0.3

# atenuación bajo la voz (sidechain)
with wave.open(os.path.join(RAIZ, 'public/ayuno/narracion.wav')) as w:
    voz = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64) / 32768
voz = np.pad(voz, (0, max(0, N - len(voz))))[:N]
env = np.abs(voz)
env = sosfiltfilt(butter(1, 3 / (SR / 2), 'low', output='sos'), env)
env = np.clip(env / (np.max(env) or 1) * 3, 0, 1)
duck = 1 - 0.5 * env

final_i = hp(mus_i * duck * 0.8 + efx_i, 25)
final_d = hp(mus_d * duck * 0.8 + efx_d, 25)
fin = np.clip((DUR - t) / 2.5, 0, 1) * np.clip(t / 0.8, 0, 1)
final = np.stack([final_i * fin, final_d * fin], axis=1)
final = final / np.max(np.abs(final)) * 0.8
with wave.open(os.path.join(RAIZ, 'public/ayuno/banda.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((final * 32767).astype('<i2').tobytes())
print('banda.wav', round(DUR, 2), 's ·', len(TOMAS), 'tomas')

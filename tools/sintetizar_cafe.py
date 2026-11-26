"""
Música y efectos de sonido de "¿Qué le pasa a tu cuerpo si tomas 5 cafés al día durante 30 días?".

Todo se sintetiza con numpy/scipy (sin muestras externas) y se sincroniza con las escenas, las tomas,
las frases y los eventos del vídeo (src/videos/cafe/tiempos.json y plan.json). La música baja donde
suena la voz.

Escribe:
    public/cafe/banda.wav               música + efectos (estéreo, 48 kHz)
    public/cafe/mezcla.wav              voz + música + efectos (si existe public/cafe/voz.wav)
    out/cafe-30-dias-efectos.mp4        vídeo con la banda (sin voz)
    out/cafe-30-dias-final.mp4          vídeo final con voz, música y efectos (-14 LUFS)

Uso:  python3 tools/sintetizar_cafe.py      (después de tools/voz_cafe.py y tools/render_cafe.sh)
"""
import json
import os
import subprocess
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SR = 48000
rng = np.random.default_rng(8)

T = json.load(open(os.path.join(RAIZ, 'src/videos/cafe/tiempos.json'), encoding='utf-8'))
PLAN = json.load(open(os.path.join(RAIZ, 'src/videos/cafe/plan.json'), encoding='utf-8'))
DUR = T['duracion']
N = int(DUR * SR)
t = np.arange(N) / SR
ESC = {e['id']: e for e in T['escenas']}
LATIDO = 0.92  # mismo periodo que el corazón animado


def lista_tomas():
    r = []
    for e in T['escenas']:
        lista = PLAN['escenas'][e['id']]
        for i, x in enumerate(lista):
            a = e['inicio'] + x['t']
            b = e['inicio'] + lista[i + 1]['t'] if i + 1 < len(lista) else e['fin']
            r.append((e['id'], x['toma'], a, b))
    return r


TOMAS = lista_tomas()
TOMA = {tm[1]: tm for tm in TOMAS}


def momento(inicio_frase, palabra):
    """Segundo en que se dice una palabra (instantes reales de la locución)."""
    f = next(x for x in T['frases'] if x['texto'].startswith(inicio_frase))
    i = max(0, f['texto'].lower().find(palabra.lower()))
    return f['palabras'][len(f['texto'][:i].split(' ')) - 1]


def rnd_js(s):
    """El mismo pseudoaleatorio que usa la animación (rnd de escena.tsx)."""
    x = np.sin(s * 127.1 + 311.7) * 43758.5453
    return x - np.floor(x)


# ------------------------------------------------------------------------------------ utilidades
def filtro(x, tipo, f, orden=2):
    return sosfilt(butter(orden, np.array(f) / (SR / 2), tipo, output='sos'), x)


def lp(x, f, o=2):
    return filtro(x, 'low', f, o)


def hp(x, f, o=2):
    return filtro(x, 'high', f, o)


def bp(x, f1, f2, o=2):
    return filtro(x, 'band', [f1, min(f2, SR / 2 - 100)], o)


def tramo(a, b, fi=1.5, fo=1.5):
    return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)


def nota(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def dur(s):
    return np.arange(int(s * SR)) / SR


def ruido(s):
    return rng.standard_normal(int(s * SR))


I = np.zeros(N)  # izquierda
D = np.zeros(N)  # derecha


def poner(x, inicio, gan=1.0, pan=0.5, dest=None):
    """Coloca un sonido mono en estéreo (pan 0 = izquierda, 1 = derecha)."""
    a = int(inicio * SR)
    if a >= N or inicio < 0 and a + len(x) <= 0:
        return
    if a < 0:
        x = x[-a:]
        a = 0
    b = min(N, a + len(x))
    li, ld = dest if dest else (I, D)
    li[a:b] += x[: b - a] * gan * np.sqrt(1 - pan)
    ld[a:b] += x[: b - a] * gan * np.sqrt(pan)


# ------------------------------------------------------------------------------------ efectos
def latido():
    d = dur(0.6)

    def golpe(a, f, g):
        return np.where(d >= a, np.sin(2 * np.pi * f * (d - a)) * np.exp(-(d - a) * 16) * g, 0)

    x = golpe(0, 52, 1.0) + golpe(0, 104, 0.22) + golpe(0.24, 46, 0.65)
    return x + lp(ruido(0.6), 200) * np.exp(-d * 25) * 0.25


def whoosh(s=1.0, subida=True, brillo=1.0):
    d = dur(s)
    n = rng.standard_normal(len(d))
    out = np.zeros_like(n)
    bloques = 28
    for i in range(bloques):
        sl = slice(i * len(d) // bloques, (i + 1) * len(d) // bloques)
        q = (i + 0.5) / bloques
        fc = 250 + 3800 * brillo * (q if subida else 1 - q) ** 1.6
        out[sl] = bp(n, fc * 0.55, fc * 1.7)[sl]
    return out * np.sin(np.pi * d / s) ** 2 * 0.55


def impacto():
    d = dur(2.6)
    sub = np.sin(2 * np.pi * (30 + 70 * np.exp(-d * 7)) * d) * np.exp(-d * 1.7)
    golpe = lp(rng.standard_normal(len(d)), 900) * np.exp(-d * 14) * 0.6
    return (sub + golpe) * 0.9


def subida(s=2.0):
    """Riser: ruido y tono que suben hasta un golpe."""
    d = dur(s)
    q = d / s
    tono = np.sin(2 * np.pi * np.cumsum(120 + 900 * q ** 2) / SR) * q ** 2 * 0.25
    n = bp(rng.standard_normal(len(d)), 800, 6000) * q ** 3 * 0.35
    return tono + n


def ding(f=1318, g=0.18):
    d = dur(1.5)
    return (np.sin(2 * np.pi * f * d) + 0.5 * np.sin(2 * np.pi * f * 1.5 * d) + 0.25 * np.sin(2 * np.pi * f * 2 * d)) * np.exp(-d * 4) * g


def tic(f=2400, g=0.12):
    d = dur(0.05)
    return np.sin(2 * np.pi * f * d) * np.exp(-d * 120) * g


def ping(f=880, g=0.2):
    d = dur(1.2)
    return (np.sin(2 * np.pi * f * d) + 0.4 * np.sin(2 * np.pi * f * 2.01 * d)) * np.exp(-d * 5) * (1 - np.exp(-d * 300)) * g


def escaner(s=3.0):
    """Barrido de rayos X: tono que sube con trémolo y ruido fino."""
    d = dur(s)
    q = d / s
    f = 180 + 1400 * q
    tono = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * d))
    n = bp(rng.standard_normal(len(d)), 3000, 9000) * 0.3
    return (tono * 0.12 + n * 0.12) * np.sin(np.pi * q) ** 1.5


def burbujeo(s, densidad=60, grave=False):
    """Gas carbónico: muchas burbujitas diminutas que estallan (crepitar)."""
    out = np.zeros(int(s * SR))
    k = int(s * densidad)
    for _ in range(k):
        a = rng.integers(0, max(1, len(out) - 2400))
        dd = dur(rng.uniform(0.02, 0.045))
        f0 = rng.uniform(1500, 5000) if not grave else rng.uniform(400, 1400)
        cola = np.cos(np.linspace(0, np.pi / 2, len(dd))) ** 2  # sin cortes bruscos
        x = np.sin(2 * np.pi * (f0 + f0 * 1.2 * dd / dd[-1]) * dd) * np.exp(-dd * rng.uniform(120, 300)) * cola * rng.uniform(0.02, 0.1)
        out[a:a + len(x)] += x
    siseo = hp(rng.standard_normal(len(out)), 5000) * 0.012
    return out + siseo


def trago():
    """Un trago: golpe de garganta con caída de tono y chasquido húmedo."""
    d = dur(0.45)
    golpe = np.sin(2 * np.pi * np.cumsum(190 * np.exp(-d * 9) + 65) / SR) * np.exp(-d * 11)
    chasq = bp(rng.standard_normal(len(d)), 400, 1400) * np.exp(-((d - 0.06) / 0.02) ** 2) * 0.6
    return (golpe + chasq) * 0.7


def liquido(s, baja=True):
    """Líquido que corre por un tubo: ruido filtrado con gorgoteo."""
    d = dur(s)
    n = rng.standard_normal(len(d))
    gorg = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * (7 + 5 * np.sin(2 * np.pi * 0.7 * d)) * d))
    out = np.zeros_like(n)
    bloques = 20
    for i in range(bloques):
        sl = slice(i * len(d) // bloques, (i + 1) * len(d) // bloques)
        q = (i + 0.5) / bloques
        fc = 1400 - 1000 * q if baja else 400 + 1000 * q
        out[sl] = bp(n, fc * 0.5, fc * 1.4)[sl]
    return out * gorg * np.sin(np.pi * d / s) ** 0.8 * 0.4


def chapoteo():
    d = dur(1.2)
    golpe = lp(rng.standard_normal(len(d)), 1500) * np.exp(-d * 9)
    burb = burbujeo(1.2, 90, grave=True) * 2.2
    return golpe * 0.5 + burb[: len(d)]


def bloop(f=None, g=0.25):
    """Gota orgánica (grasa) que aparece: burbuja grave y blanda."""
    d = dur(0.35)
    f = f or rng.uniform(180, 420)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.6 * d)) / SR) * np.exp(-d * 14) * (1 - np.exp(-d * 400)) * g


def chispa(g=0.08):
    d = dur(0.12)
    return (bp(rng.standard_normal(len(d)), 2500, 9000) * np.exp(-d * 60) + np.sin(2 * np.pi * np.cumsum(3000 - 2000 * d / d[-1]) / SR) * np.exp(-d * 40) * 0.3) * g


def acople():
    """La insulina encaja en su receptor: doble clic y tono suave."""
    d = dur(0.5)
    clic = np.where(d < 0.004, 1, 0) * 0.5 + np.where((d > 0.05) & (d < 0.054), 1, 0) * 0.35
    clic = bp(clic.astype(float), 1500, 6000) * 4
    tono = np.sin(2 * np.pi * 660 * d) * np.exp(-d * 8) * 0.12
    return clic * 0.25 + tono


def golpe_mesa():
    """Botella de plástico apoyada en la mesa."""
    d = dur(0.6)
    thud = np.sin(2 * np.pi * np.cumsum(140 * np.exp(-d * 10) + 70) / SR) * np.exp(-d * 18)
    knock = bp(rng.standard_normal(len(d)), 700, 2500) * np.exp(-d * 45) * 0.8
    return (thud + knock) * 0.5


def cristal():
    """Vaso de vidrio: tintineo inarmónico."""
    d = dur(1.6)
    x = sum(np.sin(2 * np.pi * f * d + k) * np.exp(-d * dec) * g for k, (f, dec, g) in enumerate([(2210, 5, 0.5), (3150, 7, 0.35), (4720, 9, 0.25), (6230, 12, 0.15)]))
    return x * (1 - np.exp(-d * 2000)) * 0.25


def agua_mov(s=2.0):
    d = dur(s)
    n = lp(rng.standard_normal(len(d)), 1200)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * (1.5 + d) * d) ** 2
    return n * am * np.sin(np.pi * d / s) * 0.18 + burbujeo(s, 25, grave=True)[: len(d)]


def zumbido_red(s):
    """Flujo de sangre dentro de un vaso: rumor grave que late con el corazón."""
    d = dur(s)
    n = lp(rng.standard_normal(len(d)), 260, 3)
    pulso = 0.55 + 0.45 * np.exp(-(((d % LATIDO) - 0.08) / 0.12) ** 2)
    return n * pulso * 1.6



# ------------------------------------------------------------------------------------ efectos de apoyo (los mismos del vídeo del móvil)
def aviso_movil(g=0.22, base=1568):
    """Tono de notificación: dos notas limpias que suben (genérico)."""
    out = np.zeros(int(0.9 * SR))
    for k, f in enumerate([base, base * 1.335]):
        d = dur(0.6)
        x = (np.sin(2 * np.pi * f * d) + 0.3 * np.sin(2 * np.pi * f * 2 * d)) * np.exp(-d * 7) * (1 - np.exp(-d * 600))
        a = int(k * 0.11 * SR)
        out[a:a + len(x)] += x
    return out * g


def vibracion(s=0.4, g=0.35):
    """Zumbido del motor de vibración sobre la mesa."""
    d = dur(s)
    x = np.sign(np.sin(2 * np.pi * 165 * d)) * 0.5 + np.sin(2 * np.pi * 330 * d) * 0.3
    x = lp(x, 900) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * d))
    return x * np.sin(np.pi * d / s) ** 0.3 * g


def deslizar(g=0.12):
    """Dedo que desliza por la pantalla."""
    d = dur(0.28)
    return bp(rng.standard_normal(len(d)), 1800, 7000) * np.sin(np.pi * d / 0.28) ** 2 * g


def pop(f=None, g=0.2):
    """Burbuja que salta (recompensa)."""
    d = dur(0.3)
    f = f or rng.uniform(600, 1100)
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + 2.2 * d / 0.3)) / SR) * np.exp(-d * 18) * (1 - np.exp(-d * 800))
    return x * g


def brillo_sonoro(f0=1760, g=0.07):
    """Destello agudo con cola (dopamina)."""
    d = dur(1.2)
    x = sum(np.sin(2 * np.pi * f0 * m * d + m) / m for m in (1, 1.5, 2, 3)) * np.exp(-d * 4.5)
    return x * (1 - np.exp(-d * 200)) * g


def zap(g=0.08):
    """Impulso eléctrico de neurona."""
    d = dur(0.16)
    x = np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-d * 25) + 300) / SR) * np.exp(-d * 30)
    return (x + bp(rng.standard_normal(len(d)), 3000, 9000) * np.exp(-d * 60) * 0.4) * g


def zumbido_foco(s):
    """Tono sostenido del haz de concentración."""
    d = dur(s)
    x = np.sin(2 * np.pi * 220 * d) * 0.5 + np.sin(2 * np.pi * 330.5 * d) * 0.3 + np.sin(2 * np.pi * 440 * d + 1) * 0.15
    return x * np.clip(d / 0.5, 0, 1) * np.clip((s - d) / 0.5, 0, 1)


def glitch(g=0.25):
    """Interrupción: chasquido digital entrecortado."""
    d = dur(0.35)
    x = bp(rng.standard_normal(len(d)), 600, 6000) * (np.sin(2 * np.pi * 38 * d) > 0) * np.exp(-d * 9)
    return (x + np.sin(2 * np.pi * 90 * d) * np.exp(-d * 14) * 0.5) * g


def parpadeo_sonido(g=0.18):
    """Párpado húmedo que se cierra y se abre."""
    d = dur(0.3)
    return (lp(rng.standard_normal(len(d)), 1600) * np.exp(-((d - 0.06) / 0.03) ** 2) + lp(rng.standard_normal(len(d)), 1300) * np.exp(-((d - 0.2) / 0.03) ** 2) * 0.7) * g


def reloj(g=0.09):
    d = dur(0.06)
    return bp(rng.standard_normal(len(d)), 2500, 6500) * np.exp(-d * 120) * g


def boca_abajo():
    """Móvil que se pone boca abajo sobre la mesa: roce y golpe suave."""
    d = dur(0.7)
    roce = bp(rng.standard_normal(len(d)), 1500, 5000) * np.exp(-((d - 0.15) / 0.08) ** 2) * 0.2
    golpe = np.zeros(len(d))
    gm = golpe_mesa()[: len(d) - int(0.32 * SR)]
    golpe[int(0.32 * SR):int(0.32 * SR) + len(gm)] = gm
    return roce + golpe * 0.8


def apagado():
    """La pantalla se apaga: clic y caída de tono."""
    d = dur(0.5)
    clic = bp((d < 0.004).astype(float), 1500, 6000) * 3
    return clic * 0.2 + np.sin(2 * np.pi * np.cumsum(900 * np.exp(-d * 9) + 120) / SR) * np.exp(-d * 8) * 0.07



def porcelana(g=0.2, tono=1.0):
    """Taza de cerámica apoyada en el plato: golpe seco y tintineo corto."""
    d = dur(0.9)
    x = sum(np.sin(2 * np.pi * f * tono * d + k) * np.exp(-d * dec) * gg for k, (f, dec, gg) in enumerate([(1650, 9, 0.5), (2480, 12, 0.35), (3900, 16, 0.2)]))
    knock = bp(rng.standard_normal(len(d)), 900, 3500) * np.exp(-d * 60) * 0.7
    return (x * (1 - np.exp(-d * 3000)) + knock) * g


def vapor(s):
    """Siseo suave del café caliente."""
    d = dur(s)
    return bp(rng.standard_normal(len(d)), 3000, 9000) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.6 * d)) * np.sin(np.pi * d / s) * 0.03


def latido_cabeza():
    """Pulso sordo del dolor de cabeza."""
    d = dur(0.7)
    return lp(np.sin(2 * np.pi * np.cumsum(70 * np.exp(-d * 6) + 38) / SR), 400) * np.exp(-d * 6) * (1 - np.exp(-d * 120))


# ------------------------------------------------------------------------------------ música
mus_i = np.zeros(N)
mus_d = np.zeros(N)


def sierra(f, tt, arm=8, det=0.0):
    x = np.zeros_like(tt)
    for k in range(1, arm + 1):
        x += np.sin(2 * np.pi * f * k * (1 + det) * tt + k * 1.3) / k
    return x


# dron grave (Re) que respira
dron = np.sin(2 * np.pi * 73.4 * t) * 0.5 + np.sin(2 * np.pi * 146.8 * t + 0.4) * 0.3 + np.sin(2 * np.pi * 220.0 * t + 1.1) * 0.08
dron *= (0.75 + 0.25 * np.sin(2 * np.pi * t / 7.0)) * np.clip(t / 2.5, 0, 1)
fin_dron = 1 - tramo(ESC['final']['inicio'] + 1.5, DUR + 5, 4, 0.1) * 0.7
mus_i += dron * 0.26 * fin_dron
mus_d += dron * 0.26 * fin_dron

# acordes cálidos: la energía sube con la cafeína, la noche se oscurece, el día 30 se tensa y el final se resuelve
ACORDES = {
    'intro': [38, 50, 53, 57, 64],      # Rem(add9)
    'dia1': [46, 58, 62, 65, 69],       # Sib maj7
    'dia7': [43, 55, 58, 62, 65],       # Sol m7
    'dia15': [39, 51, 55, 58, 62],      # Mib maj7 (noche)
    'dia30': [40, 52, 55, 58, 61],      # Mi semidisminuido: tensión
    'final': [41, 53, 57, 60, 64, 67],  # Fa maj9: calma
}
pad_i = np.zeros(N)
pad_d = np.zeros(N)
for e in T['escenas']:
    a, b = e['inicio'], e['fin']
    env = tramo(a - 1.0, b + 1.0, 2.0, 2.0) if e['id'] != 'final' else tramo(a - 1.0, DUR - 0.2, 2.0, 4.0)
    sel = env > 0
    for k, n in enumerate(ACORDES[e['id']]):
        g = 0.2 / (1 + k * 0.25)
        pad_i[sel] += sierra(nota(n), t[sel], 8, -0.0035) * g * env[sel]
        pad_d[sel] += sierra(nota(n), t[sel], 8, 0.0035) * g * env[sel]
mus_i += lp(pad_i, 850) * 0.42
mus_d += lp(pad_d, 850) * 0.42

# arpegio tipo marimba que acelera con la cafeína (día 1 → día 7), se frena de noche y se agita el día 30
for esc, bpm, brillo_arp in (('dia1', 100, 1.0), ('dia7', 116, 1.0), ('dia15', 84, 0.6), ('dia30', 124, 0.8)):
    a, b = ESC[esc]['inicio'] + 0.4, ESC[esc]['fin'] - 0.2
    paso = 60 / bpm / 4
    ac = ACORDES[esc]
    patron = [ac[1] + 12, ac[2] + 12, ac[3] + 12, ac[4] + 12, ac[3] + 12, ac[2] + 12]
    k = 0
    tt = a
    while tt < b:
        d = dur(paso * 0.95)
        f = nota(patron[k % len(patron)])
        x = (np.sin(2 * np.pi * f * d) + 0.3 * np.sin(2 * np.pi * f * 4 * d) * np.exp(-d * 40)) * np.exp(-d * 13) * (1 - np.exp(-d * 600))
        x = lp(x, 2600 * brillo_arp)
        g = 0.032 * (1.4 if k % 4 == 0 else 1)
        poner(x, tt, g, 0.25 + 0.5 * ((k * 3) % 5) / 4, (mus_i, mus_d))
        tt += paso
        k += 1
    tt = a
    while tt < b:
        d = dur(60 / bpm * 0.8)
        x = lp(sierra(nota(ac[0]), d, 6), 300) * np.exp(-d * 5) * (1 - np.exp(-d * 200))
        poner(x, tt, 0.09, 0.5, (mus_i, mus_d))
        tt += 60 / bpm

# campanitas en las tomas microscópicas
micro = {'cerebro', 'receptores', 'tolerancia', 'cerebroNoche'}
escala = [62, 65, 67, 69, 72, 74, 77]
for (_, toma, a, b) in TOMAS:
    if toma not in micro:
        continue
    for i in range(int((b - a) * 2.0)):
        f = nota(escala[rng.integers(len(escala))])
        d = dur(1.6)
        x = np.sin(2 * np.pi * f * d) * np.exp(-d * 3) * (1 - np.exp(-d * 200)) * 0.04
        poner(x, a + i / 2.0 + rng.uniform(0, 0.1), 1, rng.uniform(0.15, 0.85), (mus_i, mus_d))

# acorde final luminoso con "DORMIR BIEN"
t_cierre = momento('La mejor', 'La') + 0.2
for k, n in enumerate([53, 57, 60, 64, 67, 72]):
    d = dur(6.0)
    x = np.sin(2 * np.pi * nota(n) * d) * np.exp(-d * 0.6) * (1 - np.exp(-d * 40)) * 0.055
    poner(x, t_cierre + k * 0.07, 1, 0.25 + k * 0.1, (mus_i, mus_d))


# ------------------------------------------------------------------------------------ efectos sincronizados
def rel(toma, frase, palabra):
    return momento(frase, palabra) - TOMA[toma][2]


# título: subida + golpe
poner(subida(1.2), -0.6, 0.5)
poner(impacto(), 0.3, 0.55)
for k in range(4):
    poner(whoosh(0.5, True, 0.8), 0.25 + k * 0.25, 0.22, 0.3 + k * 0.15)

# introducción: vapor de la taza, barrido de rayos X al volverse transparente y latidos
poner(vapor(4.0), 0.2, 1, 0.65)
poner(escaner(3.2), 2.8, 0.9, 0.5)
for k in range(5):
    poner(latido(), 5.6 + k * LATIDO, 0.35, 0.5)

# día 1 · trago: el café baja por el esófago
a, b = TOMA['trago'][2], TOMA['trago'][3]
poner(trago(), a + 0.15, 0.7, 0.5)
poner(liquido(b - a, True), a + 0.2, 0.5, 0.5)
poner(chapoteo(), b - 0.4, 0.35, 0.55)

# día 1 · sangre: flujo y pulso
a, b = TOMA['sangre'][2], TOMA['sangre'][3]
poner(lp(rng.standard_normal(int((b - a + 0.6) * SR)), 300) * 0.06 * np.sin(np.pi * dur(b - a + 0.6) / (b - a + 0.6)), a, 1)
for k in range(int((b - a) / LATIDO) + 1):
    poner(latido(), a + 0.2 + k * LATIDO, 0.3, 0.5)

# día 1 · cerebro: la cafeína llega (brillos que suben)
a, b = TOMA['cerebro'][2], TOMA['cerebro'][3]
poner(subida(b - a) * 0.5, a, 0.5)
for k in range(8):
    poner(brillo_sonoro(1320 + k * 110, 0.05), a + 0.2 + k * (b - a - 0.4) / 8, 1, rng.uniform(0.2, 0.8))

# día 1 · receptores: la cafeína encaja en cada receptor y la adenosina sale despedida; "te despejas"
a = TOMA['receptores'][2]
ra = rel('receptores', 'Allí ocupa', 'ocupa')
for i in range(14):
    tt = a + ra + 0.9 + rnd_js(i + 7) * 1.6
    poner(acople(), tt - 0.1, 0.8, 0.3 + 0.4 * rnd_js(i + 1))
    poner(whoosh(0.35, False, 0.6), tt - 0.5, 0.06, 0.5)
t_desp = momento('Por eso', 'despejas')
poner(subida(1.0) * 0.6, t_desp - 1.0, 0.5)
poner(impacto() * 0.5, t_desp, 0.5)
for k, n in enumerate([70, 74, 77, 81]):
    poner(ding(nota(n), 0.07), t_desp + k * 0.06, 1, 0.3 + k * 0.12)

# día 1 · corazón: latidos que se aceleran con la adrenalina (mismo tiempo deformado que la animación)
a, b = TOMA['corazon'][2], TOMA['corazon'][3] + 0.45
ma, mc = rel('corazon', 'Por eso', 'adrenalina'), rel('corazon', 'Por eso', 'corazón') + 0.6
fase, tt, sig = 0.0, 0.0, 0.0
paso = 1 / 600
while tt < b - a:
    q = np.clip((tt - ma) / (mc - ma), 0, 1)
    fase += (1 + 0.45 * (q * q * (3 - 2 * q))) * paso
    if fase >= sig:
        poner(latido(), a + tt, 0.55, 0.5)
        sig += LATIDO
    tt += paso
poner(subida(1.2) * 0.4, a + ma - 1.0, 0.5)

# día 7 · tazas: cada taza aparece sobre la mesa; aviso grave al pasar el límite
a = TOMA['tazas'][2]
tc = rel('tazas', 'Día siete', 'Cinco')
for i in range(5):
    poner(porcelana(0.35, 1 + i * 0.04), a + tc - 0.1 + i * 0.22 + 0.15, 1, 0.3 + i * 0.1)
    poner(tic(1800 + i * 200, 0.08), a + tc + i * 0.22, 1, 0.3 + i * 0.1)
poner(vapor(6.0), a + tc, 1.2, 0.5)
t450 = momento('Día siete', '450')
for k in range(12):
    poner(tic(1500 + k * 120, 0.06), t450 - 0.6 + k * 0.08, 1, 0.55)
t400 = momento('Es más', '400')
poner(lp(sierra(110, dur(0.8), 6), 900) * np.exp(-dur(0.8) * 3) * 0.25, t400 - 0.1, 1, 0.5)
poner(lp(sierra(104, dur(0.8), 6), 900) * np.exp(-dur(0.8) * 3) * 0.25, t400 + 0.35, 1, 0.5)

# día 7 · tolerancia: brotan receptores nuevos y la adenosina vuelve a encajar
a = TOMA['tolerancia'][2]
ta = rel('tolerancia', 'Y tu cerebro', 'fabricar') - 0.1
tb = rel('tolerancia', 'Y tu cerebro', 'receptores') + 0.3
for i in range(12):
    poner(bloop(rng.uniform(260, 520), 0.12), a + ta + 0.4 + rnd_js(2 * i + 1) * 1.2, 1, rng.uniform(0.2, 0.8))
    poner(acople(), a + tb + 0.9 + rnd_js(2 * i + 1) * 1.5, 0.45, rng.uniform(0.2, 0.8))
t_igual = momento('Y tu cerebro', 'mismo')
d = dur(2.2)
poner(np.sin(2 * np.pi * np.cumsum(660 - 330 * d / d[-1]) / SR) * np.exp(-d * 1.2) * 0.07, t_igual, 1, 0.5)

# día 15 · noche: grillos, latidos lentos y reloj
a, b = TOMA['sangreNoche'][2], TOMA['cerebroNoche'][3]
tt = a + 0.5
while tt < b:
    d = dur(0.12)
    x = np.sin(2 * np.pi * 4300 * d) * (np.sin(2 * np.pi * 40 * d) > 0) * np.sin(np.pi * d / 0.12)
    poner(x * 0.012, tt, 1, rng.uniform(0.1, 0.9))
    tt += rng.uniform(0.5, 1.1)
for k in range(int((TOMA['sangreNoche'][3] - a) / 1.1)):
    poner(latido(), a + 0.3 + k * 1.1, 0.25, 0.5)
for m in (momento('El café de', 'cinco'), momento('El café de', 'diez')):
    for k in range(6):
        poner(reloj(0.08), m - 0.3 + k * 0.08, 1, 0.6)
    poner(ping(988, 0.12), m + 0.2, 1, 0.5)
# cerebro de noche: chispazos de cafeína que cortan el sueño
a, b = TOMA['cerebroNoche'][2], TOMA['cerebroNoche'][3]
for i in range(int((b - a) * 3)):
    if rng.random() < 0.35:
        poner(zap(0.035), a + i / 3 + rng.uniform(0, 0.1), 1, rng.uniform(0.1, 0.9))
poner(ping(587, 0.12), momento('Duermes', 'cansado'), 1, 0.4)
poner(ding(880, 0.1), momento('Duermes', 'otro'), 1, 0.6)

# día 30 · abstinencia: pulso del dolor de cabeza, cansancio y glitch de irritabilidad
a, b = TOMA['abstinencia'][2], TOMA['abstinencia'][3]
td = rel('abstinencia', 'Día treinta', 'dolor')
per = 2 * np.pi / 7  # mismo ritmo que el pulso rojo de la animación: máximos de sin(7t)
tt = (np.pi / 2 + 2 * np.pi * np.ceil((7 * td - np.pi / 2) / (2 * np.pi))) / 7 - 0.05
while tt < b - a:
    poner(latido_cabeza(), a + tt, 0.5, 0.5)
    tt += per
poner(ping(440, 0.12), momento('Día treinta', 'cansancio') - 0.1, 1, 0.4)
d = dur(1.4)
poner(np.sin(2 * np.pi * np.cumsum(330 - 160 * d / d[-1]) / SR) * np.exp(-d * 1.5) * 0.06, momento('Día treinta', 'cansancio'), 1, 0.5)
ti = momento('Día treinta', 'irritabilidad')
for k in range(3):
    poner(glitch(0.15), ti + k * 0.18, 1, 0.3 + k * 0.2)

# día 30 · cuerpo: nervios, palpitaciones y acidez
for m, f in [(momento('Y en dosis', 'nervios'), 740), (momento('Y en dosis', 'palpitaciones'), 830), (momento('Y en dosis', 'acidez'), 930)]:
    poner(ping(f, 0.14), m - 0.15, 1, 0.3)
    poner(whoosh(0.5, True, 1.0), m - 0.5, 0.12, 0.3)
tp = momento('Y en dosis', 'palpitaciones')
for k in range(6):
    poner(latido(), tp + k * 0.5, 0.45, 0.5)
poner(burbujeo(1.6, 50, grave=True) * 1.5, momento('Y en dosis', 'acidez'), 1, 0.6)

# final: la taza se apoya en la mesa, consejos y cierre
a = TOMA['final'][2]
poner(porcelana(0.4, 0.9), a + 2.75, 1, 0.65)
poner(vapor(3.0), a, 0.8, 0.65)
for k, m in enumerate([momento('El café no', 'hasta'), momento('La clave', 'último')]):
    poner(ding(1318 + k * 250, 0.1), m, 1, 0.4 + k * 0.2)
poner(impacto() * 0.4, t_cierre, 0.5)
poner(subida(1.2) * 0.35, t_cierre - 1.2, 0.5)

# transiciones entre tomas (whoosh) y golpe con cada "DÍA"
for i, (esc, toma, a, b) in enumerate(TOMAS):
    if i == 0:
        continue
    nueva = TOMAS[i - 1][0] != esc
    poner(whoosh(1.3 if nueva else 0.9, i % 2 == 0), a - (0.8 if nueva else 0.5), 0.55 if nueva else 0.4, 0.4 + 0.2 * (i % 2))
    if nueva and esc != 'final':
        poner(impacto(), a + 0.15, 0.6)
        poner(ding(1318, 0.14), a + 0.4, 1, 0.45)
        poner(ding(1760, 0.08), a + 0.45, 1, 0.55)
        for k in range(8):
            poner(tic(2200 + k * 90, 0.05), a + 0.4 + k * 0.11, 1, 0.3 + k * 0.05)

# ------------------------------------------------------------------------------------ mezcla
def reverb(x, seg=3.0, semilla=0):
    r = np.random.default_rng(semilla)
    d = dur(seg)
    ir = r.standard_normal(len(d)) * np.exp(-d * 6.9 / seg)
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    return fftconvolve(x, ir)[: len(x)]


mi = mus_i + reverb(mus_i, 3.5, 1) * 0.5
md = mus_d + reverb(mus_d, 3.5, 2) * 0.5
fi = I + reverb(I, 1.8, 3) * 0.25
fd = D + reverb(D, 1.8, 4) * 0.25

# hueco para la voz: la música baja (−6 dB) y los efectos algo menos donde va cada frase
voz = np.zeros(N)
for f in T['frases']:
    voz = np.maximum(voz, tramo(f['inicio'] - 0.15, f['fin'] + 0.25, 0.25, 0.4))
mi *= 1 - 0.5 * voz
md *= 1 - 0.5 * voz
fi *= 1 - 0.2 * voz
fd *= 1 - 0.2 * voz

L = hp(mi * 0.8 + fi, 25)
R = hp(md * 0.8 + fd, 25)
env = np.clip((DUR - t) / 2.2, 0, 1) * np.clip(t / 0.05, 0, 1)
mezcla = np.stack([L * env, R * env], axis=1)
# limitador suave y nivel con margen para la voz
mezcla = np.tanh(mezcla / np.percentile(np.abs(mezcla), 99.95) * 0.9) * 0.6

os.makedirs(os.path.join(RAIZ, 'public/cafe'), exist_ok=True)
ruta_wav = os.path.join(RAIZ, 'public/cafe/banda.wav')
with wave.open(ruta_wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mezcla * 32767).astype('<i2').tobytes())
print('banda.wav', round(DUR, 2), 's ·', len(TOMAS), 'tomas')

video = os.path.join(RAIZ, 'out/cafe-30-dias.mp4')
salida = os.path.join(RAIZ, 'out/cafe-30-dias-efectos.mp4')
if os.path.exists(video):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', video, '-i', ruta_wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-shortest', '-movflags', '+faststart', salida], check=True)
    print('vídeo con efectos:', os.path.relpath(salida, RAIZ))

# ------------------------------------------------------------------------------------ con tu voz
# Si existe public/cafe/voz.wav (tools/voz_cafe.py), mezcla voz + música + efectos y normaliza
# a -14 LUFS (nivel habitual de TikTok/Reels/Shorts).
ruta_voz = os.path.join(RAIZ, 'public/cafe/voz.wav')
if os.path.exists(ruta_voz):
    with wave.open(ruta_voz) as w:
        v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    # voz algo más presente: limpia graves y realza la inteligibilidad
    v = hp(v, 80)
    v = v + bp(v, 2500, 5000) * 0.25
    hablando = np.abs(v) > 1e-4
    v = v / (np.sqrt(np.mean(v[hablando] ** 2)) or 1) * 0.12
    mix = mezcla * 0.55 + np.stack([v, v], axis=1)
    mix = np.tanh(mix / 0.95) * 0.95
    ruta_mix = os.path.join(RAIZ, 'public/cafe/mezcla.wav')
    with wave.open(ruta_mix, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype('<i2').tobytes())
    print('mezcla con voz: public/cafe/mezcla.wav')
    if os.path.exists(video):
        final = os.path.join(RAIZ, 'out/cafe-30-dias-final.mp4')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', video, '-i', ruta_mix, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                        '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final], check=True)
        print('vídeo final con voz:', os.path.relpath(final, RAIZ))


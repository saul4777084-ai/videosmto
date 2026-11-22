"""
Música y efectos de sonido de "¿Qué le pasa a tu cuerpo si tomas Coca-Cola durante 30 días?".

Todo se sintetiza con numpy/scipy (sin muestras externas) y se sincroniza con las escenas, las
tomas y las frases del vídeo (src/videos/cola/tiempos.json y plan.json). NO incluye voz: la música
baja de volumen donde va cada frase para dejar sitio a la locución que grabes.

Escribe:
    public/cola/banda.wav                 música + efectos (estéreo, 48 kHz) para tu editor
    out/coca-cola-30-dias-efectos.mp4     el vídeo con esa banda sonora (sin voz)
    out/coca-cola-30-dias-final.mp4       con tu voz (si existe public/cola/voz.wav, ver tools/voz_cola.py)

Uso:  python3 tools/sintetizar_cola.py
"""
import json
import os
import subprocess
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SR = 48000
rng = np.random.default_rng(30)

T = json.load(open(os.path.join(RAIZ, 'src/videos/cola/tiempos.json'), encoding='utf-8'))
PLAN = json.load(open(os.path.join(RAIZ, 'src/videos/cola/plan.json'), encoding='utf-8'))
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
    """Segundo en que se dice una palabra (mismo reparto por letras que los subtítulos)."""
    f = next(x for x in T['frases'] if x['texto'].startswith(inicio_frase))
    i = max(0, f['texto'].lower().find(palabra.lower()))
    if 'palabras' in f:
        return f['palabras'][len(f['texto'][:i].split(' ')) - 1]
    return f['inicio'] + (f['fin'] - f['inicio']) * i / len(f['texto'])


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


# ------------------------------------------------------------------------------------ música
mus_i = np.zeros(N)
mus_d = np.zeros(N)

# dron grave (Re) que respira despacio
dron = np.sin(2 * np.pi * 36.7 * t) * 0.55 + np.sin(2 * np.pi * 73.4 * t + 0.4) * 0.35 + np.sin(2 * np.pi * 110.0 * t + 1.1) * 0.12
dron *= (0.75 + 0.25 * np.sin(2 * np.pi * t / 8.0)) * np.clip(t / 2.5, 0, 1)
fin_dron = 1 - tramo(ESC['final']['inicio'] + 2, DUR + 5, 5, 0.1) * 0.6
mus_i += dron * 0.3 * fin_dron
mus_d += dron * 0.3 * fin_dron


def sierra(f, tt, arm=8, det=0.0):
    x = np.zeros_like(tt)
    for k in range(1, arm + 1):
        x += np.sin(2 * np.pi * f * k * (1 + det) * tt + k * 1.3) / k
    return x


# acordes por escena: la tensión crece hasta el día 30 y se resuelve (mayor) en el final
ACORDES = {
    'intro': [38, 50, 53, 57, 64],      # Rem(add9)
    'dia1': [34, 46, 50, 53, 60],       # Sib
    'dia7': [36, 48, 51, 55, 62],       # Dom(add9)
    'dia15': [37, 49, 52, 56, 59],      # tenso
    'dia30': [38, 50, 51, 55, 58, 61],  # cluster
    'final': [41, 53, 57, 60, 64, 69],  # Famaj7: luz
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
mus_i += lp(pad_i, 850) * 0.45
mus_d += lp(pad_d, 850) * 0.45

# ostinato de suspense (corcheas graves) que acelera del día 1 al día 30
for esc, bpm in (('dia1', 92), ('dia7', 100), ('dia15', 108), ('dia30', 116)):
    a, b = ESC[esc]['inicio'] + 0.4, ESC[esc]['fin'] - 0.2
    paso = 60 / bpm / 2
    base = ACORDES[esc][0] + 12
    patron = [0, 0, 12, 0, 3, 0, 12, 7]
    k = 0
    tt = a
    while tt < b:
        d = dur(paso * 0.95)
        f = nota(base + patron[k % len(patron)])
        x = sierra(f, d, 6) * np.exp(-d * 9) * (1 - np.exp(-d * 300))
        x = lp(x, 1100)
        g = 0.07 * (1.25 if k % 4 == 0 else 1)
        poner(x, tt, g, 0.35 + 0.3 * (k % 2), (mus_i, mus_d))
        tt += paso
        k += 1

# campanitas en las tomas microscópicas
micro = {'estomago', 'vasoAzucar', 'globulos', 'pancreas', 'insulina', 'higadoGraso', 'hepatocitos', 'cerebro'}
escala = [74, 77, 79, 81, 84, 86, 89]
for (_, toma, a, b) in TOMAS:
    if toma not in micro:
        continue
    for i in range(int((b - a) * 2.2)):
        f = nota(escala[rng.integers(len(escala))])
        d = dur(1.6)
        x = np.sin(2 * np.pi * f * d) * np.exp(-d * 3) * (1 - np.exp(-d * 200)) * 0.045
        poner(x, a + i / 2.2 + rng.uniform(0, 0.1), 1, rng.uniform(0.15, 0.85), (mus_i, mus_d))

# acorde final luminoso con el rótulo "AGUA"
t_agua = momento('Tu mejor bebida', 'Tu') + 0.3
for k, n in enumerate([65, 69, 72, 77, 81]):
    d = dur(5.5)
    x = np.sin(2 * np.pi * nota(n) * d) * np.exp(-d * 0.7) * (1 - np.exp(-d * 40)) * 0.06
    poner(x, t_agua + k * 0.06, 1, 0.3 + k * 0.1, (mus_i, mus_d))

# ------------------------------------------------------------------------------------ efectos sincronizados
# título: subida + golpe; aparición del texto
poner(subida(1.2), -0.9 + 0.3, 0.5)
poner(impacto(), 0.3, 0.55)
for k in range(3):
    poner(whoosh(0.5, True, 0.8), 0.25 + k * 0.25, 0.25, 0.3 + k * 0.2)

# introducción: crepitar del refresco junto a la mano, barrido de rayos X al volverse transparente
a = TOMA['intro'][2]
poner(burbujeo(5.0, 40), a + 0.2, 0.5, 0.7)
poner(escaner(3.4), a + 2.6, 1.0)
poner(whoosh(1.6, True, 1.2), a + 2.4, 0.35)

# latidos donde el corazón se ve (cuerpo completo) y amortiguados en los vasos
for (esc, toma, a, b) in TOMAS:
    cuerpo = toma in ('intro', 'cuerpo30', 'final', 'higadoZoom')
    vaso = toma in ('vasoAzucar', 'globulos')
    if not (cuerpo or vaso):
        continue
    g = {'intro': 0.32, 'cuerpo30': 0.42, 'final': 0.22, 'higadoZoom': 0.3}.get(toma, 0.28)
    k = a + 0.4 + 0.06 - 0.02
    while k < b + 0.3:
        if toma == 'intro' and k < a + 3.2:  # el corazón aparece al volverse transparente
            k += LATIDO
            continue
        x = latido()
        if vaso:
            x = lp(x, 160)
        if toma == 'cuerpo30':
            # el corazón se resalta en "cardiovasculares"
            tc = momento('mayor riesgo', 'cardiovasculares')
            x = x * (1.6 if tc - 0.3 < k < b else 1.0)
        poner(x, k, g)
        k += LATIDO
    if vaso:
        poner(zumbido_red(b - a + 0.5), a - 0.2, 0.22)
        for i in range(int((b - a) * 2)):
            poner(whoosh(0.7, rng.random() < 0.5, 0.6), a + i * 0.5 + rng.uniform(0, 0.2), 0.08, rng.uniform(0.2, 0.8))

# día 1 · trago: el refresco entra por la boca, baja y cae al estómago
a = TOMA['trago'][2]
poner(trago(), a + 0.35, 0.9)
poner(trago(), a + 1.05, 0.6)
poner(liquido(4.6), a + 0.6, 0.9)
poner(chapoteo(), a + 5.0, 0.7)

# día 1 · estómago: gas, cristales de azúcar que caen y contador de gramos y cucharaditas
a, b = TOMA['estomago'][2], TOMA['estomago'][3]
poner(burbujeo(b - a + 0.5, 90), a - 0.1, 0.9, 0.4)
poner(burbujeo(b - a + 0.5, 70), a - 0.1, 0.8, 0.6)
for i in range(16):
    poner(bloop(rng.uniform(700, 1300), 0.08), a + 0.3 + i * (b - a) / 16, 1, rng.uniform(0.2, 0.8))
c0 = momento('Una lata', '35') - 0.2
for k in range(18):  # contador 0 → 35 g
    poner(tic(2600 + k * 40, 0.06), c0 + k * 0.05, 1, 0.6)
poner(ding(1568, 0.14), c0 + 0.95, 1, 0.65)
cu = momento('Una lata', 'siete') - 0.1
for k in range(7):  # siete cucharaditas
    poner(tic(1700 + k * 120, 0.12), cu + k * 1.0 / 7, 1, 0.55 + k * 0.03)
    poner(bloop(900 + k * 60, 0.06), cu + k * 1.0 / 7, 1, 0.6)

# día 1 · el azúcar pasa a la sangre: brillo ascendente
a = TOMA['vasoAzucar'][2]
poner(subida(2.5) * 0.6, a + 0.3, 0.6)

# día 7 · la glucosa sube (tono que sube) · páncreas libera insulina (destellos)
a = TOMA['globulos'][2]
poner(subida(3.6) * 0.5, a + 0.6, 0.6)
a, b = TOMA['pancreas'][2], TOMA['pancreas'][3]
for i in range(int((b - a) * 6)):
    poner(chispa(0.05), a + 0.5 + i / 6 + rng.uniform(0, 0.08), 1, rng.uniform(0.1, 0.9))
for k, f in enumerate([1046, 1318, 1568, 2093]):
    poner(ding(f, 0.08), a + 0.6 + k * 0.18, 1, 0.3 + k * 0.15)

# día 7 · insulina en sus receptores (mismos instantes que la animación) y canales que se abren
a, b = TOMA['insulina'][2], TOMA['insulina'][3]
for j in range(11):
    poner(acople(), a + 1.4 + rnd_js(j) * 1.2, 0.9, 0.2 + 0.6 * rnd_js(j + 7))
poner(whoosh(1.4, False, 0.7), a + 2.2, 0.35)
for i in range(int((b - a - 3) * 5)):
    poner(bloop(rng.uniform(500, 900), 0.06), a + 3.2 + i / 5 + rng.uniform(0, 0.1), 1, rng.uniform(0.2, 0.8))

# "Y así, un día tras otro": tres picos (pulsos que suben y bajan)
y = next(f for f in T['frases'] if f['texto'].startswith('Y así'))
for k in range(3):
    d = dur(0.6)
    x = np.sin(2 * np.pi * np.cumsum(300 + 500 * np.sin(np.pi * d / 0.6)) / SR) * np.sin(np.pi * d / 0.6) * 0.07
    poner(x, y['inicio'] + k * 0.55, 1, 0.3 + k * 0.2)

# día 15 · acercamiento al hígado (whoosh profundo) y gotas de grasa que aparecen cada vez más
a = TOMA['higadoZoom'][2]
poner(whoosh(3.5, False, 0.5), a + 0.5, 0.35)
for nombre, dens in (('higadoGraso', 4.0), ('hepatocitos', 5.5)):
    a, b = TOMA[nombre][2], TOMA[nombre][3]
    tt = a + 0.4
    while tt < b:
        q = (tt - a) / (b - a)
        poner(bloop(None, 0.12 + 0.12 * q), tt, 1, rng.uniform(0.15, 0.85))
        tt += 1 / (dens * (0.5 + q))

# día 30 · indicadores: un aviso por cada riesgo (mismo instante que el rótulo en pantalla)
marcas = [
    (momento('Día treinta', 'aumento'), 660),
    (momento('mayor riesgo', 'diabetes'), 740),
    (momento('mayor riesgo', 'hígado'), 830),
    (momento('mayor riesgo', 'cardiovasculares'), 930),
    (momento('Y su cafeína', 'cafeína'), 990),
]
for k, (m, f) in enumerate(marcas):
    poner(ping(f, 0.16), m - 0.15, 1, 0.3)
    poner(whoosh(0.5, True, 1.0), m - 0.5, 0.15, 0.3)
poner(subida(3.0) * 0.4, marcas[1][0] - 1.0, 0.7)
# cerebro: chispazos eléctricos
a, b = TOMA['cerebro'][2], TOMA['cerebro'][3]
for i in range(int((b - a) * 7)):
    poner(chispa(0.07), a + 0.2 + i / 7 + rng.uniform(0, 0.1), 1, rng.uniform(0.1, 0.9))

# final: botella sobre la mesa, el vaso se levanta, agua; golpe suave con "AGUA"
a = TOMA['final'][2]
poner(whoosh(1.4, True, 0.5), a + 0.9, 0.15, 0.7)
poner(golpe_mesa(), a + 2.75, 0.9, 0.65)
poner(burbujeo(1.0, 30), a + 2.8, 0.25, 0.65)
poner(cristal(), a + 3.6, 0.7, 0.62)
poner(agua_mov(2.4), a + 3.7, 0.9, 0.6)
poner(cristal() * 0.6, a + 5.85, 0.5, 0.58)
poner(impacto() * 0.5, t_agua, 0.5)
poner(subida(1.2) * 0.4, t_agua - 1.2, 0.5)

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
        # la barra de 30 días se llena: tics
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

os.makedirs(os.path.join(RAIZ, 'public/cola'), exist_ok=True)
ruta_wav = os.path.join(RAIZ, 'public/cola/banda.wav')
with wave.open(ruta_wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mezcla * 32767).astype('<i2').tobytes())
print('banda.wav', round(DUR, 2), 's ·', len(TOMAS), 'tomas')

video = os.path.join(RAIZ, 'out/coca-cola-30-dias.mp4')
salida = os.path.join(RAIZ, 'out/coca-cola-30-dias-efectos.mp4')
if os.path.exists(video):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', video, '-i', ruta_wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
                    '-shortest', '-movflags', '+faststart', salida], check=True)
    print('vídeo con efectos:', os.path.relpath(salida, RAIZ))

# ------------------------------------------------------------------------------------ con tu voz
# Si existe public/cola/voz.wav (tools/voz_cola.py), mezcla voz + música + efectos y normaliza
# a -14 LUFS (nivel habitual de TikTok/Reels/Shorts).
ruta_voz = os.path.join(RAIZ, 'public/cola/voz.wav')
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
    ruta_mix = os.path.join(RAIZ, 'public/cola/mezcla.wav')
    with wave.open(ruta_mix, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype('<i2').tobytes())
    print('mezcla con voz: public/cola/mezcla.wav')
    if os.path.exists(video):
        final = os.path.join(RAIZ, 'out/coca-cola-30-dias-final.mp4')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', video, '-i', ruta_mix, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                        '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final], check=True)
        print('vídeo final con voz:', os.path.relpath(final, RAIZ))

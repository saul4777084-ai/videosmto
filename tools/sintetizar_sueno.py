"""
Banda sonora y efectos de "¿Qué pasaría si dejaras de dormir 7 días?".
Todo se sintetiza con numpy (sin muestras externas). Uso:
    python3 tools/sintetizar_sueno.py
Genera public/sueno/musica.wav y public/sueno/sfx/*.wav
La música sigue la estructura de la narración: tensión creciente día a día y
resolución luminosa en "La buena noticia".
"""
import os
import wave
import numpy as np

SR = 44100
RAIZ = os.path.join(os.path.dirname(__file__), '..', 'public', 'sueno')
rng = np.random.default_rng(7)


def guardar(nombre, x, estereo=False):
    x = np.asarray(x, dtype=np.float64)
    pico = np.max(np.abs(x)) or 1.0
    x = x / pico * 0.89
    if estereo and x.ndim == 1:
        x = np.stack([x, x], axis=1)
    datos = (x * 32767).astype('<i2')
    ruta = os.path.join(RAIZ, nombre)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(2 if x.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(datos.tobytes())


def t_(seg):
    return np.arange(int(seg * SR)) / SR


def paso_bajo(x, corte):
    """Filtro paso bajo de un polo (corte puede ser un array)."""
    corte = np.broadcast_to(np.asarray(corte, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a[i] * acc + (1 - a[i]) * x[i]
        y[i] = acc
    return y


def env(t, ataque, caida):
    return np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / caida)


def tramo(t, a, b, fundido=1.0):
    """1 entre a y b con fundidos suaves."""
    sube = np.clip((t - a) / fundido, 0, 1)
    baja = np.clip((b - t) / fundido, 0, 1)
    return np.minimum(sube, baja)


def nota(f):
    return 440 * 2 ** ((f - 69) / 12)


# ---------------------------------------------------------------- MÚSICA
DUR = 60.1
t = t_(DUR)
L = np.zeros_like(t)
R = np.zeros_like(t)


def sumar(sig, pan=0.0):
    global L, R
    L += sig * (1 - pan) * 0.5 * 2 ** 0.5
    R += sig * (1 + pan) * 0.5 * 2 ** 0.5


# Dron grave (La1 + Mi2) durante la parte oscura, con respiración lenta
oscuro = tramo(t, 0, 53.4, 1.2)
lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t)
for f, a, d in [(nota(33), 0.5, 0.0), (nota(40), 0.28, 0.4), (nota(45), 0.16, -0.4)]:
    for det in (-0.6, 0.6):
        sumar(a * np.sin(2 * np.pi * (f + det) * t + rng.uniform(0, 6)) * oscuro * lfo, d + det * 0.3)

# Pad que se abre con cada día (más armónicos = más tensión)
tension = np.interp(t, [0, 7.2, 17, 24.3, 31.9, 38, 43.9, 44.5, 53.2], [0.15, 0.3, 0.45, 0.6, 0.78, 1.0, 1.0, 0.45, 0.4])
saw = np.zeros_like(t)
for f in (nota(57), nota(60), nota(64)):  # La menor
    for k in range(1, 9):
        saw += np.sin(2 * np.pi * f * k * t * 1.0015 + k) / k
pad = paso_bajo(saw, 300 + 1500 * tension) * 0.09 * oscuro
sumar(pad, -0.2)
sumar(np.roll(pad, 900), 0.2)

# Segunda menor disonante en las alucinaciones y la paranoia
dis = tramo(t, 27.6, 43.9, 1.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.31 * t))
sumar(0.07 * np.sin(2 * np.pi * nota(70) * t) * dis, 0.5)
sumar(0.06 * np.sin(2 * np.pi * nota(71) * t * (1 + 0.003 * np.sin(2 * np.pi * 5 * t))) * dis, -0.5)

# Pulso grave (como un bombo apagado) desde el día 1, acelerando
pulso_t = []
x = 7.23
while x < 43.9:
    pulso_t.append(x)
    x += float(np.interp(x, [7.2, 31.9, 38, 43.9], [0.8, 0.62, 0.5, 0.36]))
bombo = np.zeros_like(t)
for p in pulso_t:
    i = int(p * SR)
    tt = t_(0.5)
    golpe = np.sin(2 * np.pi * (45 + 60 * np.exp(-tt * 30)) * tt) * env(tt, 0.004, 0.12)
    bombo[i:i + len(golpe)] += golpe[: len(bombo) - i]
sumar(bombo * 0.42, 0)

# Subida antes de Randy Gardner
riser = tramo(t, 41.0, 43.95, 0.2) * np.clip((t - 41.0) / 2.95, 0, 1) ** 2
ruido = rng.standard_normal(len(t))
sumar(paso_bajo(ruido, 200 + 6000 * riser) * riser * 0.25, 0)

# Gardner (1964): arpegio de cinta antigua con vaivén
cinta = tramo(t, 44.2, 53.3, 0.8)
arpe = [nota(n) for n in (57, 60, 64, 67, 64, 60)]
mel = np.zeros_like(t)
for k in range(int(9.2 / 0.38)):
    t0 = 44.2 + k * 0.38
    i = int(t0 * SR)
    tt = t_(0.9)
    f = arpe[k % len(arpe)] * (1 + 0.004 * np.sin(2 * np.pi * 0.8 * (t0 + tt)))
    s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * env(tt, 0.01, 0.35)
    mel[i:i + len(s)] += s[: len(mel) - i]
sumar(paso_bajo(mel, 2500) * cinta * 0.22, 0.25)

# Resolución: La mayor cálido + campanillas
luz = tramo(t, 53.17, 61, 1.4) * np.clip((DUR - t) / 2.5, 0, 1)
for f, a in [(nota(45), 0.3), (nota(57), 0.2), (nota(61), 0.16), (nota(64), 0.16), (nota(69), 0.1)]:
    sumar(a * np.sin(2 * np.pi * f * t) * luz * (0.85 + 0.15 * np.sin(2 * np.pi * 0.2 * t + f)), rng.uniform(-0.4, 0.4))
for k, n in enumerate([81, 85, 88, 93, 88, 85, 81, 88]):
    t0 = 53.4 + k * 0.62
    i = int(t0 * SR)
    tt = t_(2.0)
    s = np.sin(2 * np.pi * nota(n) * tt) * env(tt, 0.002, 0.6) * 0.12
    sumar(np.pad(s, (i, max(0, len(t) - i - len(s))))[: len(t)], (-1) ** k * 0.4)

master = np.clip(np.minimum(t / 0.8, 1), 0, 1)
L *= master
R *= master
guardar('musica.wav', np.stack([L, R], axis=1))

# ---------------------------------------------------------------- EFECTOS
tt = t_(1.6)
impacto = np.sin(2 * np.pi * (38 + 90 * np.exp(-tt * 9)) * tt) * env(tt, 0.002, 0.45)
impacto += paso_bajo(rng.standard_normal(len(tt)), 1800) * env(tt, 0.001, 0.05) * 1.5
guardar('sfx/impacto.wav', impacto)

tt = t_(1.3)
sub = paso_bajo(rng.standard_normal(len(tt)), 300 + 7000 * (tt / 1.3) ** 2) * (tt / 1.3) ** 1.5
sub += 0.3 * np.sin(2 * np.pi * (200 + 600 * (tt / 1.3) ** 2) * tt) * (tt / 1.3)
guardar('sfx/subida.wav', sub)

tt = t_(0.35)
parp = paso_bajo(rng.standard_normal(len(tt)), 900) * np.sin(np.pi * tt / 0.35) ** 2
parp += 0.6 * np.sin(2 * np.pi * 70 * tt) * env(tt, 0.15, 0.08)
guardar('sfx/parpadeo.wav', parp)

tt = t_(2.2)
zum = np.sin(2 * np.pi * 6200 * tt) * np.sin(np.pi * tt / 2.2) * 0.4
guardar('sfx/zumbido.wav', zum)

tt = t_(0.6)
gr = np.zeros_like(tt)
for k in range(9):
    i = int(rng.uniform(0, 0.35) * SR)
    c = rng.standard_normal(int(0.02 * SR)) * np.exp(-np.arange(int(0.02 * SR)) / 160)
    gr[i:i + len(c)] += c * rng.uniform(0.4, 1)
gr += 0.4 * np.sin(2 * np.pi * 120 * tt) * env(tt, 0.002, 0.08)
guardar('sfx/grieta.wav', gr)

tt = t_(1.1)
tripa = np.sin(2 * np.pi * (70 + 25 * np.sin(2 * np.pi * 3 * tt)) * tt + 3 * np.sin(2 * np.pi * 9 * tt))
tripa = paso_bajo(tripa * np.sin(np.pi * tt / 1.1), 400)
guardar('sfx/tripa.wav', tripa)

tt = t_(0.45)
gl = np.zeros_like(tt)
pos = 0
while pos < len(tt):
    n = int(rng.uniform(0.015, 0.06) * SR)
    f = rng.choice([180, 440, 900, 1800, 3500])
    seg = np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * rng.uniform(0.3, 1)
    if rng.random() < 0.3:
        seg = rng.standard_normal(n) * 0.6
    gl[pos:pos + n] = seg[: len(gl) - pos]
    pos += n
gl = np.round(gl * 6) / 6
guardar('sfx/glitch.wav', gl)

tt = t_(2.4)
dist = np.zeros_like(tt)
for f in (110, 113.5, 220.7):
    dist += np.sin(2 * np.pi * f * tt * (1 + 0.08 * np.sin(2 * np.pi * 0.9 * tt)))
dist = paso_bajo(dist, 900) * np.sin(np.pi * tt / 2.4) ** 2
guardar('sfx/distorsion.wav', dist)

tt = t_(1.8)
sus = paso_bajo(rng.standard_normal(len(tt)), 2500) - paso_bajo(rng.standard_normal(len(tt)), 700)
sus *= (0.5 + 0.5 * np.sin(2 * np.pi * 4.5 * tt)) * np.sin(np.pi * tt / 1.8) ** 2
guardar('sfx/susurro.wav', sus)
print('ok')

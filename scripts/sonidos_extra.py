#!/usr/bin/env python3
"""Biblioteca de efectos de sonido para los reels (síntesis pura, sin grabaciones de terceros).

Uso: python3 scripts/sonidos_extra.py public/sfx

Genera WAV mono de 44,1 kHz normalizados a -1 dBFS. Es determinista: volver a
ejecutarlo da los mismos archivos. Para retocar un sonido, cambia su función.
"""
import os
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
RNG = np.random.default_rng(11)


# ---------------------------------------------------------------- utilidades

def t_(d):
    return np.arange(int(d * SR)) / SR


def ruido(d):
    return RNG.standard_normal(int(d * SR))


def marron(d):
    x = np.cumsum(ruido(d))
    x -= np.convolve(x, np.ones(2000) / 2000, mode="same")  # quita la deriva
    return x


def pb(x, fc, o=2):
    return sosfilt(butter(o, fc, btype="lowpass", fs=SR, output="sos"), x)


def pa(x, fc, o=2):
    return sosfilt(butter(o, fc, btype="highpass", fs=SR, output="sos"), x)


def banda(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], btype="bandpass", fs=SR, output="sos"), x)


def seno(f, t):
    f = np.broadcast_to(f, t.shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def env(n, ataque=0.005, caida=None):
    e = np.ones(n)
    k = max(1, int(ataque * SR))
    e[:k] = np.linspace(0, 1, k)
    if caida:
        e *= np.exp(-np.arange(n) / SR / caida)
    return e


def fundido(x, ini=0.05, fin=0.3):
    x = x.copy()
    a, b = int(ini * SR), int(fin * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def colocar(base, x, t):
    i = int(t * SR)
    j = min(len(base), i + len(x))
    if i < len(base):
        base[i:j] += x[: j - i]
    return base


def resonador(x, fs_q):
    """Suma de bandas estrechas: da 'cuerpo' a un golpe (madera, metal, cristal)."""
    return sum(a * banda(x, f * (1 - 1 / (2 * q)), f * (1 + 1 / (2 * q)), o=2) for f, q, a in fs_q)


def guardar(carpeta, nombre, x):
    x = np.nan_to_num(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (-1 / 20)
    with wave.open(os.path.join(carpeta, f"{nombre}.wav"), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


# ---------------------------------------------------------------- clima

def trueno(d=4.5, inicio=0.0):
    x = np.zeros(int(d * SR))
    base = pb(marron(d), 180, o=4)
    e = np.zeros_like(x)
    for t0, a, c in [(inicio + 0.05, 1.0, 0.5), (inicio + 0.45, 0.8, 0.9), (inicio + 1.2, 0.6, 1.4), (inicio + 2.1, 0.35, 1.2)]:
        k = int(t0 * SR)
        n = len(x) - k
        e[k:] += a * env(n, 0.08, c)
    return fundido(base * e, 0.01, 0.8)


def rayo():
    d = 4.5
    x = trueno(d, inicio=0.12) * 0.9
    crack = pa(ruido(0.25), 1500, o=3) * env(int(0.25 * SR), 0.001, 0.05)
    chisporroteo = np.zeros(int(0.35 * SR))
    for _ in range(40):
        colocar(chisporroteo, pa(ruido(0.004), 3000) * RNG.uniform(0.3, 1), RNG.uniform(0, 0.3))
    colocar(x, crack * 2.2, 0)
    colocar(x, chisporroteo * 1.4, 0.01)
    return x


def lluvia(d=6.0, densidad=500):
    x = pb(banda(ruido(d), 800, 9000), 6000) * 0.25
    for _ in range(int(d * densidad)):
        f = RNG.uniform(2000, 7000)
        n = int(RNG.uniform(0.002, 0.008) * SR)
        gota = np.sin(2 * np.pi * f * np.arange(n) / SR) * env(n, 0.0005, 0.002)
        colocar(x, gota * RNG.uniform(0.05, 0.4), RNG.uniform(0, d))
    return fundido(x, 0.4, 0.6)


def viento(d=5.0, lo=180, hi=900, fuerza=1.0):
    t = t_(d)
    x = ruido(d)
    rafagas = 0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * t + 1) * np.sin(2 * np.pi * 0.11 * t)
    # el centro del filtro sube y baja con las ráfagas
    out = np.zeros_like(x)
    trozo = 2048
    for i in range(0, len(x), trozo):
        c = lo + (hi - lo) * rafagas[i]
        out[i : i + trozo] = banda(x[max(0, i - 4096) : i + trozo], c * 0.6, c * 1.6)[-len(x[i : i + trozo]) :]
    return fundido(out * rafagas * fuerza, 0.6, 0.8)


def brisa(d=5.0):
    x = viento(d, 400, 1400) * 0.7
    hojas = np.zeros(int(d * SR))
    for _ in range(int(d * 35)):
        colocar(hojas, pa(ruido(0.03), 3500) * env(int(0.03 * SR), 0.005, 0.01) * RNG.uniform(0.1, 0.5), RNG.uniform(0, d))
    return fundido(x + hojas * 0.6, 0.8, 1.0)


def tormenta():
    d = 8.0
    x = lluvia(d, 900) * 1.0 + viento(d, 150, 600) * 0.6
    colocar(x, trueno(4.5) * 1.6, 2.0)
    colocar(x, rayo() * 1.2, 5.2)
    return fundido(x, 0.5, 1.0)


def nubes(d=4.0):
    t = t_(d)
    aire = pb(ruido(d), 900) * 0.4
    acorde = sum(seno(f * (1 + 0.003 * np.sin(2 * np.pi * 0.3 * t + i)), t) for i, f in enumerate([220, 277.2, 329.6, 440]))
    e = np.sin(np.pi * t / d) ** 1.5
    return (aire + acorde * 0.25) * e


# ---------------------------------------------------------------- agua

def gota():
    t = t_(0.18)
    f = 650 + 1300 * (1 - np.exp(-t / 0.012))
    return seno(f, t) * env(len(t), 0.001, 0.03)


def burbuja_sola(f0=None):
    f0 = f0 or RNG.uniform(300, 900)
    t = t_(0.09)
    return seno(f0 * (1 + 2.5 * t / 0.09), t) * env(len(t), 0.002, 0.025)


def burbujas(d=2.0, n=22):
    x = np.zeros(int(d * SR))
    for _ in range(n):
        colocar(x, burbuja_sola() * RNG.uniform(0.3, 1), RNG.uniform(0, d - 0.1))
    return x


def salpicadura():
    d = 1.0
    x = banda(ruido(d), 500, 7000) * env(int(d * SR), 0.003, 0.15)
    for _ in range(14):
        colocar(x, gota() * RNG.uniform(0.1, 0.4), RNG.uniform(0.1, 0.8))
    return x


def chapuzon():
    d = 2.0
    t = t_(d)
    golpe = seno(110 * np.exp(-t / 0.15) + 40, t) * env(len(t), 0.002, 0.12)
    agua = banda(ruido(d), 300, 6000) * env(len(t), 0.004, 0.3)
    x = golpe * 1.2 + agua
    colocar(x, burbujas(1.2, 18) * 0.5, 0.5)
    return x


def arroyo(d=6.0):
    x = banda(ruido(d), 300, 2500) * 0.3 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.5 * t_(d)))
    colocar(x, burbujas(d, int(d * 30)) * 0.8, 0)
    return fundido(x, 0.5, 0.6)


def vertido(d=3.0):
    t = t_(d)
    x = ruido(d)
    out = np.zeros_like(x)
    trozo = 2048
    for i in range(0, len(x), trozo):
        c = 450 + 900 * (i / len(x))  # el vaso se llena: la resonancia sube
        out[i : i + trozo] = banda(x[max(0, i - 4096) : i + trozo], c * 0.85, c * 1.15)[-len(x[i : i + trozo]) :]
    return fundido(out + banda(x, 1500, 6000) * 0.15, 0.1, 0.3)


# ---------------------------------------------------------------- hielo y cristal

def tintineo(f0=None, d=0.6):
    f0 = f0 or RNG.uniform(2200, 3400)
    t = t_(d)
    return sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / c) for r, a, c in [(1, 1, 0.12), (1.47, 0.6, 0.08), (2.09, 0.4, 0.05), (2.76, 0.25, 0.04)])


def cubitos():
    x = np.zeros(int(1.6 * SR))
    for t0 in [0.0, 0.18, 0.31, 0.55, 0.62, 0.9]:
        colocar(x, tintineo() * RNG.uniform(0.4, 1), t0)
    return x


def hielo_crujido():
    d = 1.4
    x = np.zeros(int(d * SR))
    t = 0.0
    while t < 1.0:
        n = int(0.02 * SR)
        chasquido = resonador(ruido(0.02) * env(n, 0.0005, 0.004), [(RNG.uniform(1800, 5000), 8, 1), (RNG.uniform(600, 1200), 5, 0.5)])
        colocar(x, chasquido * RNG.uniform(0.4, 1), t)
        t += RNG.uniform(0.01, 0.09) * (1.2 - t)
    quejido = seno(70 + 25 * np.sin(2 * np.pi * 3 * t_(d)), t_(d)) * 0.15 * env(int(d * SR), 0.2, 0.6)
    return x + pb(np.sign(quejido) * np.abs(quejido) ** 0.7, 900) * 0.4


def congelar():
    d = 1.6
    t = t_(d)
    x = sum(np.sin(2 * np.pi * (f + 900 * t) * t) * 0.2 for f in [1500, 2250, 3000])
    brillo = pa(ruido(d), 6000) * 0.15
    return fundido((x + brillo) * np.sin(np.pi * t / d), 0.02, 0.3)


def cristal_roto():
    d = 1.5
    x = np.zeros(int(d * SR))
    colocar(x, pa(ruido(0.12), 1200) * env(int(0.12 * SR), 0.001, 0.04) * 2, 0)
    for _ in range(30):
        colocar(x, tintineo(RNG.uniform(2500, 6000), 0.4) * RNG.uniform(0.1, 0.6), RNG.uniform(0.02, 1.0) ** 1.6)
    return x


# ---------------------------------------------------------------- golpes

def toc():
    n = int(0.3 * SR)
    impulso = ruido(0.3) * env(n, 0.0003, 0.003)
    return resonador(impulso, [(320, 6, 1), (780, 8, 0.6), (1450, 10, 0.3)]) * env(n, 0.0005, 0.06)


def toc_toc():
    x = np.zeros(int(0.9 * SR))
    for t0 in [0, 0.17, 0.34]:
        colocar(x, toc(), t0)
    return x


def madera():
    n = int(0.25 * SR)
    impulso = ruido(0.25) * env(n, 0.0003, 0.002)
    return resonador(impulso, [(900, 12, 1), (2100, 14, 0.5)]) * env(n, 0.0005, 0.04)


def metal():
    t = t_(2.0)
    golpe = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / c) for f, a, c in [(523, 1, 0.9), (1187, 0.6, 0.6), (1849, 0.45, 0.4), (2717, 0.3, 0.25), (3923, 0.2, 0.15)])
    return golpe + pa(ruido(2.0), 3000) * env(len(t), 0.0005, 0.01) * 0.5


def pasos():
    x = np.zeros(int(2.4 * SR))
    for i, t0 in enumerate([0.1, 0.65, 1.2, 1.75]):
        n = int(0.18 * SR)
        golpe = pb(ruido(0.18), 250) * env(n, 0.002, 0.03) * 2
        grava = banda(ruido(0.18), 1500, 6000) * env(n, 0.005, 0.05) * 0.4
        colocar(x, (golpe + grava) * (0.9 if i % 2 else 1), t0)
    return x


def latido():
    x = np.zeros(int(2.0 * SR))
    for t0 in [0.1, 1.0]:
        for dt, a in [(0, 1), (0.22, 0.7)]:
            t = t_(0.25)
            colocar(x, seno(55 + 30 * np.exp(-t / 0.03), t) * env(len(t), 0.004, 0.06) * a, t0 + dt)
    return x


def reloj(d=4.0):
    x = np.zeros(int(d * SR))
    for i, t0 in enumerate(np.arange(0, d - 0.05, 0.5)):
        n = int(0.04 * SR)
        clic = resonador(ruido(0.04) * env(n, 0.0002, 0.002), [(2600 if i % 2 == 0 else 2000, 15, 1)])
        colocar(x, clic, t0)
    return x


# ---------------------------------------------------------------- fuego y explosiones

def fuego(d=5.0):
    x = pb(marron(d), 300) * 0.5
    for _ in range(int(d * 60)):
        colocar(x, pa(ruido(0.006), 2000) * RNG.uniform(0.1, 1) ** 2 * 1.5, RNG.uniform(0, d))
    return fundido(x, 0.4, 0.6)


def explosion():
    d = 3.0
    t = t_(d)
    boom = seno(130 * np.exp(-t / 0.25) + 28, t) * env(len(t), 0.002, 0.6)
    estruendo = pb(marron(d), 400) * env(len(t), 0.003, 0.8)
    return boom * 1.4 + estruendo


# ---------------------------------------------------------------- interfaz y otros

def moneda():
    x = np.zeros(int(0.7 * SR))
    colocar(x, tintineo(1975, 0.6), 0)
    colocar(x, tintineo(2637, 0.6), 0.07)
    return x


def caja_registradora():
    x = np.zeros(int(1.4 * SR))
    colocar(x, toc() * 0.5, 0)
    colocar(x, metal()[: int(1.2 * SR)] * 0.5, 0.12)
    for t0 in [0.15, 0.2, 0.28, 0.33]:
        colocar(x, tintineo(RNG.uniform(3000, 4500), 0.3) * 0.5, t0)
    return x


def camara():
    x = np.zeros(int(0.4 * SR))
    for t0, f in [(0, 2200), (0.11, 1600)]:
        n = int(0.05 * SR)
        colocar(x, resonador(ruido(0.05) * env(n, 0.0003, 0.004), [(f, 6, 1)]) + pa(ruido(0.05), 4000) * env(n, 0.001, 0.01) * 0.3, t0)
    return x


def notificacion():
    x = np.zeros(int(0.7 * SR))
    for t0, f in [(0, 880), (0.12, 1318.5)]:
        t = t_(0.5)
        colocar(x, (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(len(t), 0.003, 0.15), t0)
    return x


def magia():
    d = 1.8
    x = np.zeros(int(d * SR))
    for i, f in enumerate([1046.5, 1318.5, 1568, 2093, 2637, 3136]):
        t = t_(1.0)
        colocar(x, np.sin(2 * np.pi * f * t) * env(len(t), 0.002, 0.25) * 0.6, i * 0.06)
    return x + pa(ruido(d), 7000) * np.sin(np.pi * t_(d) / d) * 0.12


def caida():
    t = t_(1.2)
    return seno(1500 * np.exp(-t / 0.5) + 180, t) * env(len(t), 0.01) * np.minimum(1, (1.2 - t) * 6)



# ---------------------------------------------------------------- terror (cada uno con su propia semilla)

def _r(semilla):
    return np.random.default_rng(semilla)


def drone(d=24.0):
    """Ambiente grave y tenso para historias de terror (se puede repetir en bucle)."""
    t = t_(d)
    r = _r(101)
    x = sum(a * seno(f * (1 + 0.004 * np.sin(2 * np.pi * t / p)), t) for f, a, p in [(41, 1, 7.1), (61.7, 0.6, 9.3), (82.3, 0.35, 5.7), (123.5, 0.15, 11.0)])
    aire = pb(np.cumsum(r.standard_normal(len(t))), 300) 
    aire = aire / (np.max(np.abs(aire)) + 1e-9) * 0.25
    x = x * (0.75 + 0.25 * np.sin(2 * np.pi * t / d * 3)) + aire
    # fundido cruzado para que el bucle no se note
    k = int(1.5 * SR)
    x[:k] = x[:k] * np.linspace(0, 1, k) + x[-k:] * np.linspace(1, 0, k)
    return x[:-k]


def zumbido(d=8.0):
    """Fluorescentes: zumbido eléctrico de 100 Hz con armónicos."""
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(100, 1), (200, 0.5), (300, 0.3), (500, 0.12), (1000, 0.05)])
    r = _r(102)
    x = x * (0.9 + 0.1 * np.sin(2 * np.pi * 0.3 * t)) + pa(r.standard_normal(len(t)), 4000) * 0.03
    return fundido(x, 0.3, 0.3)


def estatica():
    """Salto de imagen de cámara de seguridad: ruido cortado."""
    r = _r(103)
    d = 0.35
    x = banda(r.standard_normal(int(d * SR)), 300, 7000)
    corte = (np.sin(2 * np.pi * 37 * t_(d)) > -0.2).astype(float)
    return x * corte * env(len(x), 0.001, 0.15)


def susto():
    """Golpe de susto: impacto grave + chirrido disonante."""
    r = _r(104)
    d = 3.0
    t = t_(d)
    golpe = seno(110 * np.exp(-t / 0.08) + 38, t) * env(len(t), 0.001, 0.6)
    chirrido = sum(seno(f * (1 + 0.02 * t), t) for f in [880, 932, 1245, 1319]) * env(len(t), 0.002, 0.9) * 0.18
    ruido_ = banda(r.standard_normal(len(t)), 200, 5000) * env(len(t), 0.001, 0.25) * 0.5
    return fundido(golpe * 1.6 + chirrido + ruido_, 0, 0.6)


def campanita():
    """Campanita de la puerta de una tienda."""
    t = t_(2.2)
    x = np.zeros(len(t))
    for t0, a in [(0, 1), (0.11, 0.7), (0.26, 0.45)]:
        tt = t_(2.2 - t0)
        g = sum(b * np.sin(2 * np.pi * f * tt) * np.exp(-tt / c) for f, b, c in [(2093, 1, 0.7), (4186, 0.35, 0.35), (5274, 0.25, 0.25)])
        colocar(x, g * a, t0)
    return x


def toc_cristal():
    """Un nudillo contra un cristal."""
    r = _r(105)
    n = int(0.35 * SR)
    impulso = r.standard_normal(n) * env(n, 0.0002, 0.002)
    return resonador(impulso, [(1150, 10, 1), (2350, 14, 0.6), (3900, 18, 0.3), (420, 5, 0.5)]) * env(n, 0.0003, 0.07)


def latido_rapido(d=4.0):
    x = np.zeros(int(d * SR))
    for t0 in np.arange(0.05, d - 0.3, 0.55):
        for dt, a in [(0, 1), (0.16, 0.65)]:
            t = t_(0.22)
            colocar(x, seno(55 + 30 * np.exp(-t / 0.03), t) * env(len(t), 0.004, 0.05) * a, t0 + dt)
    return x


def rebobinar():
    """Cinta rebobinando: chirrido que sube."""
    r = _r(106)
    d = 1.6
    t = t_(d)
    tono = seno(600 + 2400 * (t / d) ** 1.5, t) * 0.35
    siseo = pa(r.standard_normal(len(t)), 2500) * 0.25
    return fundido(tono + siseo, 0.05, 0.15)


def respiracion(d=4.0):
    """Respiración lenta y ronca muy cerca (dos inspiraciones)."""
    r = _r(107)
    x = np.zeros(int(d * SR))
    for t0, dur, lo, hi in [(0.1, 1.1, 300, 1600), (1.3, 0.9, 200, 1100), (2.3, 1.1, 300, 1600), (3.4, 0.5, 200, 1100)]:
        n = int(dur * SR)
        aire = banda(r.standard_normal(n), lo, hi) * np.sin(np.pi * np.arange(n) / n) ** 1.5
        ronquido = np.sin(2 * np.pi * 70 * np.arange(n) / SR) * (r.standard_normal(n) * 0.5 + 0.5) * 0.12 * np.sin(np.pi * np.arange(n) / n)
        colocar(x, aire + ronquido, t0)
    return fundido(x, 0.05, 0.3)


def cerradura():
    """Llave que entra y gira: roce metálico y clac."""
    r = _r(108)
    x = np.zeros(int(1.2 * SR))
    n = int(0.35 * SR)
    roce = banda(r.standard_normal(n), 2500, 8000) * env(n, 0.02) * np.linspace(1, 0.3, n) * 0.4
    colocar(x, roce, 0)
    for t0, f in [(0.55, 1800), (0.75, 1200)]:
        m = int(0.12 * SR)
        clac = resonador(r.standard_normal(m) * env(m, 0.0002, 0.003), [(f, 12, 1), (f * 2.3, 15, 0.5)]) * env(m, 0.0003, 0.04)
        colocar(x, clac, t0)
    return x


TERROR = {"respiracion": respiracion, "cerradura": cerradura, "drone": drone, "zumbido": zumbido, "estatica": estatica, "susto": susto, "campanita": campanita,
          "toc_cristal": toc_cristal, "latido_rapido": latido_rapido, "rebobinar": rebobinar}


SONIDOS = {
    # clima
    "trueno": trueno, "rayo": rayo, "lluvia": lluvia, "tormenta": tormenta, "viento": viento, "brisa": brisa, "nubes": nubes,
    # agua
    "gota": gota, "burbujas": burbujas, "salpicadura": salpicadura, "chapuzon": chapuzon, "arroyo": arroyo, "vertido": vertido,
    # hielo y cristal
    "cubitos": cubitos, "hielo_crujido": hielo_crujido, "congelar": congelar, "cristal_roto": cristal_roto,
    # golpes
    "toc": toc, "toc_toc": toc_toc, "madera": madera, "metal": metal, "pasos": pasos, "latido": latido, "reloj": reloj,
    # fuego
    "fuego": fuego, "explosion": explosion,
    # interfaz
    "moneda": moneda, "caja_registradora": caja_registradora, "camara": camara, "notificacion": notificacion, "magia": magia, "caida": caida,
}

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    carpeta = args[0] if args else "public/sfx"
    os.makedirs(carpeta, exist_ok=True)
    # los de terror tienen semilla propia: se pueden generar solos con "--terror"
    lista = TERROR if "--terror" in sys.argv else {**SONIDOS, **TERROR}
    for nombre, fn in lista.items():
        guardar(carpeta, nombre, fn())
        print("✓", nombre)

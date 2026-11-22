#!/usr/bin/env python3
"""Música de fondo cinematográfica para los reels (síntesis pura, sin grabaciones de terceros).

Uso: python3 scripts/musica_fondo.py SALIDA.wav [--segundos 120] [--giro 0.66]

Pads con acordes, bajo, latido y arpegio, con reverberación. Empieza en re menor (tensión) y en la
fracción --giro de la duración pasa a fa mayor (esperanza), pensado para la «buena noticia» del guion.
Estéreo, 44,1 kHz, pico a -3 dBFS. Determinista: misma salida cada vez.
"""
import argparse
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
RNG = np.random.default_rng(7)
BPM = 80
PULSO = 60 / BPM
COMPAS = PULSO * 4


def nota(n):
    """Frecuencia de una nota MIDI."""
    return 440.0 * 2 ** ((n - 69) / 12)


# acordes (notas MIDI); cada uno dura 2 compases
TENSO = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]  # Dm Bb F C
ESPERANZA = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53, 57]]  # F C Dm Bbmaj7


def envolvente(n, ataque, caida):
    a = max(1, int(ataque * SR))
    c = max(1, int(caida * SR))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) if a < n else np.linspace(0, 1, n)[: min(a, n)]
    if c < n:
        e[-c:] *= np.linspace(1, 0, c)
    return e


def pad(frec, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.12, 0.0, 0.11):  # tres voces desafinadas = coro
        f = frec * 2 ** (det / 12)
        for h, amp in ((1, 1.0), (2, 0.35), (3, 0.15), (4, 0.06)):
            s += amp * np.sin(2 * np.pi * f * h * t + RNG.random() * 6.28)
    s *= 1 + 0.15 * np.sin(2 * np.pi * 0.2 * t)  # vaivén lento
    return s * envolvente(n, dur * 0.35, dur * 0.4)


def pulsado(frec, dur, brillo):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * frec * t) + brillo * 0.4 * np.sin(2 * np.pi * frec * 2 * t) + brillo * 0.15 * np.sin(2 * np.pi * frec * 3 * t)
    return s * np.exp(-t * 6) * envolvente(n, 0.004, 0.05)


def latido(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 55 * np.exp(-t * 9) + 38
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def paso_bajo(x, corte):
    return sosfilt(butter(2, corte, "low", fs=SR, output="sos"), x)


def generar(segundos, giro):
    n = int(segundos * SR)
    izq = np.zeros(n)
    der = np.zeros(n)
    t_giro = segundos * giro

    def poner(señal, ini, vol, pan=0.0):
        i = int(ini * SR)
        if i >= n:
            return
        s = señal[: n - i] * vol
        izq[i : i + len(s)] += s * (1 - pan) ** 0.5
        der[i : i + len(s)] += s * (1 + pan) ** 0.5

    dur_acorde = COMPAS * 2
    k = 0
    t = 0.0
    while t < segundos:
        lista = TENSO if t < t_giro else ESPERANZA
        acorde = lista[k % len(lista)]
        intensidad = min(1.0, t / (segundos * 0.5)) if t < t_giro else 0.8 + 0.2 * min(1.0, (t - t_giro) / 10)
        # pad (con cola para que se solapen) y bajo
        for j, m in enumerate(acorde):
            poner(paso_bajo(pad(nota(m), dur_acorde * 1.4), 1800 + 1600 * intensidad), t, 0.10, pan=(-0.5, 0.0, 0.5, 0.25)[j % 4])
        poner(paso_bajo(pad(nota(acorde[0] - 24), dur_acorde * 1.2), 300), t, 0.22)
        # latido desde los 6 s, cada vez más presente
        if t >= 6:
            for b in (0, 2):
                for c in range(2):
                    poner(latido(0.6), t + c * COMPAS + b * PULSO, 0.35 * intensidad)
        # arpegio desde el 20 % de la duración (más brillante tras el giro)
        if t >= segundos * 0.2:
            brillo = 0.4 if t < t_giro else 1.0
            figura = acorde + [acorde[1] + 12, acorde[2] + 12, acorde[1] + 12]
            for c in range(16):
                m = figura[c % len(figura)] + 12
                poner(pulsado(nota(m), 0.5, brillo), t + c * PULSO / 2, 0.06 * (0.5 + intensidad * 0.5), pan=np.sin(c) * 0.6)
        t += dur_acorde
        k += 1

    # subida antes del giro (ruido filtrado que crece) y destello al llegar
    d = 4.0
    m = int(d * SR)
    sube = paso_bajo(RNG.standard_normal(m), 3000) * np.linspace(0, 1, m) ** 2
    poner(sube, t_giro - d, 0.06)
    poner(sube[::-1] * 0.5, t_giro, 0.04)

    # reverberación: ruido con caída exponencial
    ir_n = int(2.8 * SR)
    ir = RNG.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.2)
    ir = paso_bajo(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    izq = izq + 0.45 * fftconvolve(izq, ir)[:n]
    der = der + 0.45 * fftconvolve(der, ir[::-1])[:n]

    # entrada y salida suaves
    e = envolvente(n, 2.5, 4.0)
    est = np.stack([izq * e, der * e], axis=1)
    est /= np.max(np.abs(est)) / 10 ** (-3 / 20)
    return est


def guardar(ruta, est):
    datos = (est * 32767).astype("<i2")
    with wave.open(ruta, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(datos.tobytes())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("salida")
    ap.add_argument("--segundos", type=float, default=120)
    ap.add_argument("--giro", type=float, default=0.66)
    a = ap.parse_args()
    est = generar(a.segundos, a.giro)
    assert est.shape[1] == 2 and np.max(np.abs(est)) <= 1.0
    guardar(a.salida, est)
    print(f"{a.salida}: {a.segundos:.0f} s, giro a fa mayor en {a.segundos * a.giro:.0f} s")

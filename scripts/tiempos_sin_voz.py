#!/usr/bin/env python3
"""Tiempos de lectura para reels SIN voz (mismo formato que scripts/alinear_voz.py, con "provisional": true).

Cada palabra dura según su longitud (ritmo cómodo de lectura en el móvil), con pausas en comas y puntos,
y cada frase se queda un poco en pantalla al acabar. Si luego llega una voz, se alinea con alinear_voz.py
y el reel la usa sin tocar nada más.

Uso: python3 scripts/tiempos_sin_voz.py guion.json tiempos.json [--fijos 0:4.2,12:4.5] [--ritmo 1.0]
  --fijos   segundos fijos para frases concretas (índice:segundos), p. ej. el gancho y el final
  --ritmo   >1 más rápido, <1 más lento
"""
import argparse
import json
import re


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion")
    ap.add_argument("salida")
    ap.add_argument("--fijos", default="")
    ap.add_argument("--ritmo", type=float, default=1.0)
    a = ap.parse_args()
    fijos = {int(k): float(v) for k, v in (p.split(":") for p in a.fijos.split(",") if p)}
    frases = json.load(open(a.guion))
    out, t0 = [], 0.0
    for i, texto in enumerate(frases):
        palabras = texto.split(" ")
        t = 0.25
        tiempos = []
        for p in palabras:
            tiempos.append(round(t, 2))
            letras = len(re.sub(r"[^\wáéíóúüñÁÉÍÓÚÜÑ]", "", p))
            t += (0.17 + 0.042 * letras) / a.ritmo
            if p.endswith((",", ":", ";")):
                t += 0.22 / a.ritmo
            elif p.endswith((".", "?", "!", "»")):
                t += 0.38 / a.ritmo
        segundos = max(3.0, t + 0.9)
        if i in fijos:
            escala = min(1.0, (fijos[i] - 0.6) / t) if t > 0 else 1
            tiempos = [round(x * escala, 2) for x in tiempos]
            segundos = fijos[i]
        segundos = round(segundos, 2)
        out.append({"texto": texto, "palabras": [round(t0 + x, 2) for x in tiempos], "inicio": round(t0, 2), "segundos": segundos, "tiempos": tiempos})
        t0 += segundos
    json.dump({"provisional": True, "duracion": round(t0, 3), "frases": out}, open(a.salida, "w"), ensure_ascii=False, indent=1)
    print(f"{len(out)} frases, {t0:.1f} s")


if __name__ == "__main__":
    main()

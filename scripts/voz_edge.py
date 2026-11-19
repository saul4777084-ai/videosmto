#!/usr/bin/env python3
"""Voz en off gratis con edge-tts (voces neuronales de Microsoft Edge; necesita internet).

Uso:
  python3 scripts/voz_edge.py GUION.json SALIDA.mp3 [--voz es-MX-JorgeNeural] [--velocidad 1.0] [--pausa 0.35] [--tono +0Hz]
  python3 scripts/voz_edge.py --listar          # voces en español

GUION.json es una lista de frases (la misma que usa alinear_voz.py). Cada frase se genera por separado
y se juntan con una pausa, con el mismo volumen estándar que voz_local.py.
Necesita acceso a speech.platform.bing.com. No es una API oficial: es gratis, pero Microsoft
podría cambiarla o cortarla sin avisar.
"""
import argparse
import asyncio
import json
import os
import subprocess
import tempfile

import edge_tts

# en entornos con proxy (p. ej. Claude Code en la nube) aiohttp no lo lee solo: se le pasa a mano
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or None


async def listar():
    for v in sorted(await edge_tts.list_voices(proxy=PROXY), key=lambda v: v["ShortName"]):
        if v["Locale"].startswith("es-") or "Multilingual" in v["ShortName"]:
            print(f'{v["ShortName"]:38s} {v["Gender"]:7s} {v["Locale"]}')


async def generar(frases, voz, velocidad, tono, carpeta):
    rate = f"{round((velocidad - 1) * 100):+d}%"
    rutas = []
    for i, fr in enumerate(frases):
        ruta = os.path.join(carpeta, f"{i:03d}.mp3")
        await edge_tts.Communicate(fr, voz, rate=rate, pitch=tono, proxy=PROXY).save(ruta)
        rutas.append(ruta)
        print(f"{i + 1:2d}. {fr}")
    return rutas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion", nargs="?")
    ap.add_argument("salida", nargs="?")
    ap.add_argument("--voz", default="es-MX-JorgeNeural")
    ap.add_argument("--velocidad", type=float, default=1.0, help=">1 más rápido")
    ap.add_argument("--tono", default="+0Hz", help="p. ej. -5Hz más grave, +5Hz más agudo")
    ap.add_argument("--pausa", type=float, default=0.35, help="silencio entre frases (s)")
    ap.add_argument("--listar", action="store_true")
    a = ap.parse_args()

    if a.listar:
        asyncio.run(listar())
        return
    if not (a.guion and a.salida):
        ap.error("faltan GUION.json y SALIDA.mp3")

    frases = json.load(open(a.guion, encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        rutas = asyncio.run(generar(frases, a.voz, a.velocidad, a.tono, tmp))
        entradas = sum((["-i", r] for r in rutas), [])
        filtros = "".join(
            f"[{i}:a]aresample=44100,aformat=channel_layouts=mono{f',apad=pad_dur={a.pausa}' if i < len(rutas) - 1 else ''}[a{i}];"
            for i in range(len(rutas))
        )
        union = "".join(f"[a{i}]" for i in range(len(rutas)))
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *entradas, "-filter_complex",
             f"{filtros}{union}concat=n={len(rutas)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[o]",
             "-map", "[o]", "-ar", "44100", "-b:a", "192k", a.salida],
            check=True,
        )
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.salida],
                         capture_output=True, text=True).stdout.strip()
    print(f"Total {float(dur):.2f}s → {a.salida}")


if __name__ == "__main__":
    main()

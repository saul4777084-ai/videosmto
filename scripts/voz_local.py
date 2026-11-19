#!/usr/bin/env python3
"""Genera una voz en off gratis y sin internet (Piper y Kokoro vía sherpa-onnx).

Uso:
  python3 scripts/voz_local.py GUION.json SALIDA.mp3 [--voz ald] [--velocidad 1.0] [--pausa 0.35]
  python3 scripts/voz_local.py --listar                  # voces disponibles y si están descargadas
  python3 scripts/voz_local.py --descargar [VOZ ...]     # baja los modelos (todos si no dices cuáles)

GUION.json es una lista de frases (la misma que usa alinear_voz.py).
Los modelos se guardan en ~/.cache/voces/. Todas las voces del catálogo tienen licencia libre
(dominio público, CC0, Unlicense, Apache 2.0 o CC-BY): se pueden usar en vídeos para redes.
"""
import argparse
import json
import os
import subprocess
import tempfile
import wave

import numpy as np

CACHE = os.path.expanduser("~/.cache/voces")
DESCARGAS = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models"
KOKORO = "kokoro-int8-multi-lang-v1_0"

# nombre corto -> (carpeta, id de hablante, descripción, licencia)
VOCES = {
    "ald": ("vits-piper-es_MX-ald-medium", 0, "Hombre, español de México, natural (la de Baño roto)", "Unlicense"),
    "claude": ("vits-piper-es_MX-claude-high", 0, "Hombre, español de México, alta calidad", "Apache 2.0"),
    "daniela": ("vits-piper-es_AR-daniela-high", 0, "Mujer, español de Argentina, alta calidad", "CC-BY-SA 4.0"),
    "davefx": ("vits-piper-es_ES-davefx-medium", 0, "Hombre, español de España, locutor claro", "CC0"),
    "sharvard-h": ("vits-piper-es_ES-sharvard-medium", 0, "Hombre, español de España", "CC-BY 3.0"),
    "sharvard-m": ("vits-piper-es_ES-sharvard-medium", 1, "Mujer, español de España", "CC-BY 3.0"),
    "carlfm": ("vits-piper-es_ES-carlfm-x_low", 0, "Hombre, español de España, ligera (calidad baja)", "Dominio público"),
    "dora": (KOKORO, 28, "Mujer, español neutro, muy natural (Kokoro)", "Apache 2.0"),
    "alex": (KOKORO, 29, "Hombre, español neutro, muy natural (Kokoro)", "Apache 2.0"),
    "santa": (KOKORO, 53, "Hombre, voz grave y cálida (Kokoro)", "Apache 2.0"),
}


def descargar(nombres):
    os.makedirs(CACHE, exist_ok=True)
    for carpeta in sorted({VOCES[n][0] for n in nombres}):
        if os.path.isdir(f"{CACHE}/{carpeta}"):
            continue
        print(f"Descargando {carpeta}…")
        archivo = f"{CACHE}/{carpeta}.tar.bz2"
        subprocess.run(["curl", "-sSfL", "-o", archivo, f"{DESCARGAS}/{carpeta}.tar.bz2"], check=True)
        subprocess.run(["tar", "xjf", archivo, "-C", CACHE], check=True)
        os.unlink(archivo)


def crear_tts(voz: str):
    import sherpa_onnx

    carpeta = f"{CACHE}/{VOCES[voz][0]}"
    if VOCES[voz][0] == KOKORO:
        modelo = sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=f"{carpeta}/model.int8.onnx",
                voices=f"{carpeta}/voices.bin",
                tokens=f"{carpeta}/tokens.txt",
                data_dir=f"{carpeta}/espeak-ng-data",
                lang="es",
            ),
            num_threads=4,
        )
    else:
        onnx = next(f for f in os.listdir(carpeta) if f.endswith(".onnx"))
        modelo = sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=f"{carpeta}/{onnx}", tokens=f"{carpeta}/tokens.txt", data_dir=f"{carpeta}/espeak-ng-data"
            ),
            num_threads=4,
        )
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=modelo))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion", nargs="?")
    ap.add_argument("salida", nargs="?")
    ap.add_argument("--voz", default="ald", choices=sorted(VOCES))
    ap.add_argument("--velocidad", type=float, default=1.0, help=">1 más rápido")
    ap.add_argument("--pausa", type=float, default=0.35, help="silencio entre frases (s)")
    ap.add_argument("--listar", action="store_true")
    ap.add_argument("--descargar", nargs="*")
    a = ap.parse_args()

    if a.listar:
        for n, (carpeta, _, desc, lic) in VOCES.items():
            ok = "✓" if os.path.isdir(f"{CACHE}/{carpeta}") else "·"
            print(f"{ok} {n:11s} {desc}  [{lic}]")
        return
    if a.descargar is not None:
        descargar(a.descargar or list(VOCES))
        return
    if not (a.guion and a.salida):
        ap.error("faltan GUION.json y SALIDA.mp3")

    descargar([a.voz])
    tts = crear_tts(a.voz)
    sid = VOCES[a.voz][1]
    frases = json.load(open(a.guion, encoding="utf-8"))
    trozos, sr = [], None
    for i, fr in enumerate(frases):
        audio = tts.generate(fr, sid=sid, speed=a.velocidad)
        sr = audio.sample_rate
        x = np.array(audio.samples, dtype=np.float32)
        trozos.append(x)
        if i < len(frases) - 1:
            trozos.append(np.zeros(int(sr * a.pausa), dtype=np.float32))
        print(f"{i + 1:2d}. {len(x) / sr:5.2f}s  {fr}")
    x = np.concatenate(trozos)
    x = x / (np.abs(x).max() + 1e-9) * 0.95
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        with wave.open(t.name, "w") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes((x * 32767).astype("<i2").tobytes())
        # volumen estándar para redes y un poco de cuerpo en graves
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", t.name,
             "-af", "bass=g=3,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "192k", a.salida],
            check=True,
        )
    os.unlink(t.name)
    print(f"Total {len(x) / sr:.2f}s → {a.salida}")


if __name__ == "__main__":
    main()

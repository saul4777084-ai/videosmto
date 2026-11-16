#!/usr/bin/env python3
"""Genera una voz en off sin internet con Piper (sherpa-onnx).

Uso: python3 scripts/voz_local.py GUION.json SALIDA.mp3 [--velocidad 1.0] [--pausa 0.35]

GUION.json es una lista de frases (la misma que usa alinear_voz.py).
La voz es es_MX-ald-medium (hombre, español latino), descargada en ~/.cache/voces/:
  curl -L -o ald.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_MX-ald-medium.tar.bz2
"""
import argparse
import json
import os
import subprocess
import tempfile
import wave

import numpy as np
import sherpa_onnx

VOZ = os.path.expanduser("~/.cache/voces/vits-piper-es_MX-ald-medium")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion")
    ap.add_argument("salida")
    ap.add_argument("--velocidad", type=float, default=1.0, help=">1 más rápido")
    ap.add_argument("--pausa", type=float, default=0.35, help="silencio entre frases (s)")
    a = ap.parse_args()

    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=f"{VOZ}/es_MX-ald-medium.onnx",
                tokens=f"{VOZ}/tokens.txt",
                data_dir=f"{VOZ}/espeak-ng-data",
            ),
            num_threads=4,
        ),
    )
    tts = sherpa_onnx.OfflineTts(cfg)
    frases = json.load(open(a.guion, encoding="utf-8"))
    trozos, sr = [], None
    for i, fr in enumerate(frases):
        audio = tts.generate(fr, sid=0, speed=a.velocidad)
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

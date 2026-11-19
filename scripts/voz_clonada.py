#!/usr/bin/env python3
"""Voz en off con TU voz clonada (Chatterbox Multilingual de Resemble AI, licencia MIT, gratis y en local).

Uso (con el Python del entorno aparte, que tiene torch y chatterbox):
  ~/.venvs/clonar/bin/python scripts/voz_clonada.py GUION.json SALIDA.mp3          # TU voz, versión expresiva
  ~/.venvs/clonar/bin/python scripts/voz_clonada.py GUION.json SALIDA.mp3 --referencia otra.wav
      [--expresividad 0.8] [--cfg 0.3] [--pausa 0.35]

Por defecto usa la voz del usuario (voces/mi_voz/referencia.mp3) con los ajustes que eligió: la versión
"expresiva" (expresividad 0.8, cfg 0.3). Esa carpeta está en .gitignore: el repositorio es público y una
grabación de la voz permitiría a cualquiera clonarla.

--referencia: 10–30 s de tu voz hablando normal, sin música ni eco (sirve un audio del móvil).
GUION.json es una lista de frases (la misma que usa alinear_voz.py).
Solo para clonar voces propias o con permiso de su dueño. Chatterbox añade una marca de agua inaudible.

Instalación (una vez):
  uv venv --python 3.11 ~/.venvs/clonar
  VIRTUAL_ENV=~/.venvs/clonar uv pip install --index-strategy unsafe-best-match \
      --extra-index-url https://download.pytorch.org/whl/cpu "torch==2.6.0+cpu" "torchaudio==2.6.0+cpu" chatterbox-tts "setuptools<81"
El modelo (~3 GB) se baja de Hugging Face la primera vez.
"""
import argparse
import json
import os
import subprocess
import tempfile
import time

# descarga clásica por HTTPS (el protocolo Xet de Hugging Face usa otro servidor que puede estar bloqueado)
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

import torch
import torchaudio

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI_VOZ = os.path.join(RAIZ, "voces", "mi_voz", "referencia.mp3")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("guion")
    ap.add_argument("salida")
    ap.add_argument("--referencia", default=MI_VOZ, help="audio con la voz a clonar (por defecto, la del usuario)")
    ap.add_argument("--expresividad", type=float, default=0.8, help="0.25 plana … 1.0 muy expresiva")
    ap.add_argument("--cfg", type=float, default=0.3, help="más bajo = más pausado")
    ap.add_argument("--pausa", type=float, default=0.35, help="silencio entre frases (s)")
    a = ap.parse_args()
    if not os.path.exists(a.referencia):
        ap.error(f"no encuentro la voz de referencia: {a.referencia} (pásala con --referencia)")

    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    torch.set_num_threads(os.cpu_count() or 4)
    with tempfile.TemporaryDirectory() as tmp:
        # referencia limpia: mono 24 kHz, sin silencios al principio, máximo 30 s
        ref = os.path.join(tmp, "ref.wav")
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a.referencia, "-ac", "1", "-ar", "24000",
             "-af", "silenceremove=start_periods=1:start_threshold=-45dB", "-t", "30", ref],
            check=True,
        )
        modelo = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
        frases = json.load(open(a.guion, encoding="utf-8"))
        trozos = []
        for i, fr in enumerate(frases):
            t0 = time.time()
            wav = modelo.generate(fr, language_id="es", audio_prompt_path=ref, exaggeration=a.expresividad, cfg_weight=a.cfg)
            trozos.append(wav)
            if i < len(frases) - 1:
                trozos.append(torch.zeros(1, int(modelo.sr * a.pausa)))
            print(f"{i + 1:2d}. {wav.shape[-1] / modelo.sr:5.2f}s (tardó {time.time() - t0:4.0f}s)  {fr}", flush=True)
        crudo = os.path.join(tmp, "voz.wav")
        torchaudio.save(crudo, torch.cat(trozos, dim=-1), modelo.sr)
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", crudo,
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "192k", a.salida],
            check=True,
        )
    print(f"→ {a.salida}")


if __name__ == "__main__":
    main()

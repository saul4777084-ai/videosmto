#!/usr/bin/env python3
"""Alinea una voz con el guion: calcula en qué segundo se dice cada palabra.

Uso: python3 scripts/alinear_voz.py AUDIO GUION.json SALIDA.json

GUION.json es una lista de frases (una por escena). La salida tiene, por frase,
el segundo en que empieza su escena y el segundo en que se dice cada palabra.
Usa el modelo Parakeet v3 (sherpa-onnx) de ~/.cache/becario-reels/.
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np

MODELO = os.path.expanduser("~/.cache/becario-reels/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8")


def normal(p: str) -> str:
    p = unicodedata.normalize("NFD", p.lower())
    p = "".join(c for c in p if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", p)


def cargar_audio(ruta: str) -> np.ndarray:
    crudo = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", ruta, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(crudo, dtype=np.float32)


def transcribir(x: np.ndarray):
    import sherpa_onnx

    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=f"{MODELO}/encoder.int8.onnx",
        decoder=f"{MODELO}/decoder.int8.onnx",
        joiner=f"{MODELO}/joiner.int8.onnx",
        tokens=f"{MODELO}/tokens.txt",
        model_type="nemo_transducer",
        num_threads=max(1, os.cpu_count() or 2),
    )
    s = rec.create_stream()
    s.accept_waveform(16000, x)
    rec.decode_stream(s)
    palabras = []
    for tok, t in zip(s.result.tokens, s.result.timestamps):
        if tok.startswith(" ") or tok.startswith("▁") or not palabras:
            palabras.append([tok.strip().replace("▁", ""), float(t)])
        else:
            palabras[-1][0] += tok
    return [(w, t) for w, t in palabras if normal(w)]


def main():
    audio, guion_ruta, salida = sys.argv[1:4]
    frases = json.load(open(guion_ruta, encoding="utf-8"))
    x = cargar_audio(audio)
    duracion = len(x) / 16000
    oidas = transcribir(x)
    print("Transcripción:", " ".join(w for w, _ in oidas))

    guion = [(i, p) for i, f in enumerate(frases) for p in f.split()]
    a = [normal(p) for _, p in guion]
    b = [normal(w) for w, _ in oidas]
    tiempos: list = [None] * len(guion)
    for blk in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            tiempos[blk.a + k] = oidas[blk.b + k][1]

    # las palabras sin pareja se interpolan entre sus vecinas
    conocidos = [k for k, t in enumerate(tiempos) if t is not None]
    for k in range(len(tiempos)):
        if tiempos[k] is None:
            antes = max((c for c in conocidos if c < k), default=None)
            despues = min((c for c in conocidos if c > k), default=None)
            if antes is None:
                tiempos[k] = max(0.0, tiempos[despues] - 0.3 * (despues - k))
            elif despues is None:
                tiempos[k] = min(duracion - 0.1, tiempos[antes] + 0.3 * (k - antes))
            else:
                tiempos[k] = tiempos[antes] + (tiempos[despues] - tiempos[antes]) * (k - antes) / (despues - antes)
    print(f"Palabras alineadas: {len(conocidos)}/{len(guion)}")

    resultado = []
    for i, f in enumerate(frases):
        ts = [tiempos[k] for k, (fi, _) in enumerate(guion) if fi == i]
        resultado.append({"texto": f, "palabras": [round(t, 3) for t in ts]})
    # cada escena empieza un poco antes de su primera palabra (la primera, en 0)
    for i, r in enumerate(resultado):
        r["inicio"] = 0.0 if i == 0 else round(max(resultado[i - 1]["palabras"][-1] + 0.15, r["palabras"][0] - 0.25), 3)
    for i, r in enumerate(resultado):
        fin = resultado[i + 1]["inicio"] if i + 1 < len(resultado) else duracion
        r["segundos"] = round(fin - r["inicio"], 3)
        r["tiempos"] = [round(t - r["inicio"], 3) for t in r["palabras"]]
        print(f"{i + 1:2d}. {r['inicio']:6.2f}s  {r['segundos']:5.2f}s  {r['texto']}")
    json.dump({"duracion": round(duracion, 3), "frases": resultado}, open(salida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()

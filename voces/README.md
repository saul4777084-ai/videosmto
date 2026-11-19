# Voces gratis (sin internet)

Se generan con `scripts/voz_local.py` (Piper y Kokoro vía sherpa-onnx). No gastan créditos y todas tienen
licencia libre para usarlas en vídeos. Muestras en `voces/muestras/` (`todas-las-voces.mp3` las junta en orden).

| # | Voz (`--voz`) | Cómo suena | Licencia |
|---|---|---|---|
| 1 | `ald` | Hombre, México, natural (la de Baño roto) | Unlicense |
| 2 | `claude` | Hombre, México, alta calidad | Apache 2.0 |
| 3 | `daniela` | Mujer, Argentina, alta calidad | CC-BY-SA 4.0 (citar autoría) |
| 4 | `davefx` | Hombre, España, locutor claro | CC0 |
| 5 | `sharvard-h` | Hombre, España | CC-BY 3.0 (citar autoría) |
| 6 | `sharvard-m` | Mujer, España | CC-BY 3.0 (citar autoría) |
| 7 | `carlfm` | Hombre, España, calidad baja | Dominio público |
| 8 | `dora` | Mujer, español neutro, la más natural (Kokoro) | Apache 2.0 |
| 9 | `alex` | Hombre, español neutro, la más natural (Kokoro) | Apache 2.0 |
| 10 | `santa` | Hombre, grave y cálida (Kokoro) | Apache 2.0 |

```bash
python3 scripts/voz_local.py --listar
python3 scripts/voz_local.py src/MiVideo/guion.json public/voz/mivideo.mp3 --voz alex
python3 scripts/alinear_voz.py public/voz/mivideo.mp3 src/MiVideo/guion.json src/MiVideo/tiempos.json
```

Los modelos se descargan solos a `~/.cache/voces/` la primera vez (`--descargar` los baja todos, ~900 MB).

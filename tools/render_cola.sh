#!/usr/bin/env bash
# Renderiza "CocaCola30Dias" (sin audio) por tramos y los une en out/coca-cola-30-dias.mp4.
# Cada tramo es un proceso aparte: si se interrumpe, al relanzar se saltan los tramos ya hechos.
set -euo pipefail
cd "$(dirname "$0")/.."
TOTAL=$(node -e "const t=require('./src/videos/cola/tiempos.json'); console.log(Math.round(t.duracion*30))")
TRAMO=${TRAMO:-650}
DIR=out/tramos-cola
mkdir -p "$DIR"
: > "$DIR/lista.txt"
i=0
for ((a=0; a<TOTAL; a+=TRAMO)); do
  b=$((a+TRAMO-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  f="$DIR/t$i.mp4"
  if [ ! -s "$f" ]; then
    echo "tramo $i: fotogramas $a-$b"
    npx remotion render CocaCola30Dias "$f.tmp.mp4" --frames=$a-$b --muted --gl=swangle --timeout=300000 \
      --concurrency=${CONC:-4} --crf=19 --pixel-format=yuv420p --log=error
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file 't$i.mp4'" >> "$DIR/lista.txt"
  i=$((i+1))
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$DIR/lista.txt" -c copy -movflags +faststart out/coca-cola-30-dias.mp4
echo "listo: out/coca-cola-30-dias.mp4"

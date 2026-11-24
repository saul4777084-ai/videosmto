"""Pasa un vídeo horizontal a vertical 1080×1920 con el fondo desenfocado.

Uso: python3 tools/vertical.py entrada.mp4 [salida.mp4]
Si no se da salida, crea <entrada>_vertical_1080.mp4 junto al original.
"""
import os
import subprocess
import sys


def vertical(src, out=None, ancho=1080, alto=1920, desenfoque=35):
    if out is None:
        out = os.path.splitext(src)[0] + f'_vertical_{ancho}.mp4'
    filtro = (
        '[0:v]split=2[bg][fg];'
        f'[bg]scale={ancho}:{alto}:force_original_aspect_ratio=increase,crop={ancho}:{alto},'
        f'gblur=sigma={desenfoque}[bgout];'
        f'[fg]scale={ancho}:{alto}:force_original_aspect_ratio=decrease[fgout];'
        '[bgout][fgout]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[v]'
    )
    cmd = [
        'ffmpeg', '-y', '-i', src,
        '-filter_complex', filtro,
        '-map', '[v]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart',
        out,
    ]
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if r.returncode != 0:
        sys.exit(f'ffmpeg falló:\n{r.stderr[-2000:]}')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2 or not os.path.isfile(sys.argv[1]):
        sys.exit(__doc__)
    print('Vídeo listo:', vertical(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None))

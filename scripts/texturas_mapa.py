#!/usr/bin/env python3
"""Texturas de alta calidad para el motor de mapas «Tierra» (src/comun/Tierra.tsx).

Para cada región (en mosaicos Web Mercator) genera en public/mapas/:
  <region>_alt.png       R,G = altura "rellena" + 32768 (m, 16 bits)  ·  B = máscara de tierra actual (0..255)
                         La altura rellena es la cota a la que el mar inunda ese punto llegando desde el océano
                         (priority-flood): una depresión tras una montaña no se inunda hasta que el mar la supera.
  <region>_satelite.jpg  color Blue Marble (NASA) con el relieve sombreado encima; océano con batimetría
  <region>_relieve.jpg   colores de atlas físico (tintas hipsométricas) con sombreado
y public/mapas/nubes.jpg (nubes del mundo, equirectangular, en gris).

Datos:
  · alturas y batimetría: AWS Terrain Tiles (terrarium), s3.amazonaws.com/elevation-tiles-prod
  · color: NASA Blue Marble (paquete npm three-globe, example/img/earth-blue-marble.jpg)
  · costas: Natural Earth land-10m (paquete world-atlas)

Uso: python3 scripts/texturas_mapa.py [region ...]     (sin argumentos: todas)
"""
import io
import json
import math
import os
import subprocess
import sys
import tarfile
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from skimage.morphology import reconstruction

Image.MAX_IMAGE_PIXELS = None
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/.cache/becario-reels/terrarium")
SALIDA = os.path.join(RAIZ, "public", "mapas")
META = os.path.join(RAIZ, "src", "comun", "tierra_fuentes.json")

# nombre: (zoom, x0, y0, columnas, filas) en mosaicos de 256 px
REGIONES = {
    "mundo": (4, 0, 0, 16, 16),
    "europa": (6, 28, 17, 11, 10),  # Atlántico a Turquía, del norte de África a Escandinavia
    "asia": (5, 16, 8, 14, 9),  # de Europa del Este a Corea y Japón
}


# ---------- descargas ----------

def mosaico(z, x, y):
    ruta = os.path.join(CACHE, str(z), str(x), f"{y}.png")
    if not os.path.exists(ruta):
        os.makedirs(os.path.dirname(ruta), exist_ok=True)
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
        for intento in range(4):
            try:
                datos = urllib.request.urlopen(url, timeout=60).read()
                break
            except Exception:
                if intento == 3:
                    raise
        with open(ruta, "wb") as f:
            f.write(datos)
    a = np.asarray(Image.open(ruta).convert("RGB"), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def alturas(z, x0, y0, nx, ny):
    out = np.zeros((ny * 256, nx * 256), np.float32)
    trabajos = [(i, j) for j in range(ny) for i in range(nx)]
    with ThreadPoolExecutor(16) as ex:
        for (i, j), t in zip(trabajos, ex.map(lambda ij: mosaico(z, (x0 + ij[0]) % 2**z, y0 + ij[1]), trabajos)):
            out[j * 256:(j + 1) * 256, i * 256:(i + 1) * 256] = t
    return out


def texturas_npm():
    """Blue Marble y nubes del paquete three-globe (se baja con npm pack una sola vez)."""
    dest = os.path.expanduser("~/.cache/becario-reels/three-globe")
    bm = os.path.join(dest, "earth-blue-marble.jpg")
    if not os.path.exists(bm):
        os.makedirs(dest, exist_ok=True)
        nombre = subprocess.check_output(["npm", "pack", "three-globe@2.45.6", "--silent"], cwd=dest, text=True).strip().splitlines()[-1]
        with tarfile.open(os.path.join(dest, nombre)) as t:
            for m in ("package/example/img/earth-blue-marble.jpg", "package/example/clouds/clouds.png"):
                with open(os.path.join(dest, os.path.basename(m)), "wb") as f:
                    f.write(t.extractfile(m).read())
    return bm, os.path.join(dest, "clouds.png")


# ---------- geometría ----------

def lat_de_fila(z, y0, filas):
    """latitud del centro de cada fila de píxeles (Web Mercator)."""
    py = (y0 * 256 + np.arange(filas) + 0.5) / (256 * 2**z)
    return np.degrees(np.arctan(np.sinh(math.pi * (1 - 2 * py))))


def lon_de_columna(z, x0, cols):
    px = (x0 * 256 + np.arange(cols) + 0.5) / (256 * 2**z)
    return px * 360 - 180


def mascara_tierra(z, x0, y0, nx, ny, sobre=3):
    """Natural Earth land-10m rasterizada (con antialias por sobremuestreo)."""
    geo = json.loads(
        subprocess.check_output(
            ["node", "-e", "const t=require('topojson-client');const m=require('world-atlas/land-10m.json');process.stdout.write(JSON.stringify(t.feature(m,m.objects.land)))"],
            cwd=RAIZ,
        )
    )
    W, H = nx * 256 * sobre, ny * 256 * sobre
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    n = 256 * 2**z * sobre

    def a_pixel(anillo):
        pts = []
        for lon, lat in anillo:
            lat = max(-85.05, min(85.05, lat))
            x = (lon + 180) / 360 * n - x0 * 256 * sobre
            y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n - y0 * 256 * sobre
            pts.append((x, y))
        return pts

    geom = geo["features"][0]["geometry"]
    polis = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    def desenrollar(anillo):
        """quita los saltos de 180 a -180 (cruces del antimeridiano); la Antártida (llega al polo) se deja igual."""
        if min(lat for _, lat in anillo) < -89:
            return [anillo]
        out = [list(anillo[0])]
        for lon, lat in anillo[1:]:
            prev = out[-1][0]
            while lon - prev > 180:
                lon -= 360
            while lon - prev < -180:
                lon += 360
            out.append([lon, lat])
        return [[(lon + k, lat) for lon, lat in out] for k in (-360, 0, 360)]

    for poli in polis:
        for copia in desenrollar(poli[0]):
            d.polygon(a_pixel(copia), fill=255)
        for hueco in poli[1:]:
            for copia in desenrollar(hueco):
                d.polygon(a_pixel(copia), fill=0)
    return np.asarray(img.resize((nx * 256, ny * 256), Image.BOX), dtype=np.float32) / 255


def sombreado(alt, z, y0, exageracion):
    """sombreado multidireccional (luz principal desde el noroeste) de 0 a ~1.2."""
    filas = alt.shape[0]
    lat = lat_de_fila(z, y0, filas)
    paso = 40075016.0 / (256 * 2**z) * np.cos(np.radians(lat))  # metros por píxel en cada fila
    gy, gx = np.gradient(alt)
    gx = gx / paso[:, None] * exageracion
    gy = gy / paso[:, None] * exageracion
    pendiente = np.arctan(np.hypot(gx, gy))
    aspecto = np.arctan2(-gx, gy)
    total = np.zeros_like(alt)
    for az, peso in ((315, 0.6), (270, 0.2), (0, 0.2)):
        az = math.radians(az)
        alti = math.radians(42)
        total += peso * (math.sin(alti) * np.cos(pendiente) + math.cos(alti) * np.sin(pendiente) * np.cos(az - aspecto - math.pi / 2))
    return np.clip(total / math.sin(math.radians(42)), 0, 1.4)


def paleta(valores, paradas):
    xs = np.array([p[0] for p in paradas], np.float32)
    out = np.zeros(valores.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(valores, xs, np.array([p[1][c] for p in paradas], np.float32))
    return out


# Mismo agua que en src/comun/Tierra.tsx (AGUA): profundidad en metros
AGUA = [(0, (120, 205, 220)), (25, (66, 170, 208)), (200, (38, 124, 184)), (1000, (24, 88, 158)), (3000, (14, 58, 122)), (6000, (8, 34, 84))]
TIERRA_ATLAS = [
    (-50, (113, 153, 93)), (0, (113, 153, 93)), (100, (132, 166, 102)), (300, (170, 180, 118)), (600, (201, 190, 135)),
    (1000, (205, 172, 124)), (1600, (184, 146, 108)), (2500, (158, 128, 104)), (3600, (146, 128, 118)), (4600, (214, 214, 220)), (5600, (246, 246, 250)),
]


def blue_marble_en(bm, z, x0, y0, nx, ny):
    """reproyecta la Blue Marble (equirectangular) a la región Mercator, con interpolación bilineal."""
    W, H = bm.shape[1], bm.shape[0]
    lon = lon_de_columna(z, x0, nx * 256)
    lat = lat_de_fila(z, y0, ny * 256)
    fx = ((lon + 180) / 360 * W - 0.5) % W
    fy = np.clip((90 - lat) / 180 * H - 0.5, 0, H - 1.001)
    x0i = np.floor(fx).astype(int)
    y0i = np.floor(fy).astype(int)
    tx = (fx - x0i)[None, :, None]
    ty = (fy - y0i)[:, None, None]
    x1i = (x0i + 1) % W
    a = bm[y0i][:, x0i]
    b = bm[y0i][:, x1i]
    c = bm[y0i + 1][:, x0i]
    d = bm[y0i + 1][:, x1i]
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty


def hacer_region(nombre, bm):
    z, x0, y0, nx, ny = REGIONES[nombre]
    print(f"· {nombre}: zoom {z}, {nx}×{ny} mosaicos ({nx*256}×{ny*256} px)", flush=True)
    alt = alturas(z, x0, y0, nx, ny)
    tierra = mascara_tierra(z, x0, y0, nx, ny)
    # la Antártida por debajo de -78° es tierra (la proyección corta en -85° y las costas del polo no cuentan)
    lat = lat_de_fila(z, y0, ny * 256)
    tierra[lat < -78] = np.maximum(tierra[lat < -78], (alt[lat < -78] > 0).astype(np.float32))
    es_tierra = tierra > 0.5

    # océano siempre por debajo de 0 y tierra con su altura; luego priority-flood desde el océano
    alt_mar = np.where(es_tierra, alt, np.minimum(alt, -1))
    semilla = np.where(es_tierra, alt_mar.max(), alt_mar)
    rellena = reconstruction(semilla, alt_mar, method="erosion").astype(np.float32)
    print("  inundación calculada", flush=True)

    v = np.clip(np.round(rellena + 32768), 0, 65535).astype(np.uint32)
    png = np.stack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.round(tierra * 255).astype(np.uint8)], -1)
    Image.fromarray(png, "RGB").save(os.path.join(SALIDA, f"{nombre}_alt.png"), optimize=True)

    exa = 3.2 * 2 ** ((8 - z) / 2)
    hs_t = sombreado(alt, z, y0, exa)
    hs_m = sombreado(np.minimum(alt, 0), z, y0, exa * 0.35)
    luz_t = (0.5 + 0.62 * hs_t)[..., None]
    luz_m = (0.72 + 0.32 * hs_m)[..., None]
    agua = paleta(np.maximum(-alt_mar, 0), AGUA) * luz_m
    m = tierra[..., None]

    # satélite: Blue Marble con el relieve sombreado y un poco más de saturación
    sat = blue_marble_en(bm, z, x0, y0, nx, ny)
    gris = sat.mean(-1, keepdims=True)
    sat = np.clip(gris + (sat - gris) * 1.18, 0, 255)
    sat_t = np.clip(sat * 1.08 * luz_t, 0, 255)
    # hielo (Blue Marble muy blanca y sin color): en el mar son plataformas de hielo, no agua
    hielo = np.clip((gris[..., 0] - 175) / 45, 0, 1) * np.clip(1 - (sat.max(-1) - sat.min(-1)) / 40, 0, 1)
    hielo_mar = (hielo * (1 - tierra) * (np.abs(lat) > 55)[:, None])[..., None]
    mar_sat = agua * (1 - hielo_mar) + np.clip(sat * 1.04 * luz_t, 0, 255) * hielo_mar
    Image.fromarray(np.clip(sat_t * m + mar_sat * (1 - m), 0, 255).astype(np.uint8)).save(os.path.join(SALIDA, f"{nombre}_satelite.jpg"), quality=92)

    # atlas físico: tintas hipsométricas (el hielo de verdad sale blanco gracias a la Blue Marble)
    atlas = paleta(alt, TIERRA_ATLAS)
    atlas = atlas * (1 - hielo[..., None]) + np.array([240, 244, 250], np.float32) * hielo[..., None]
    atlas_t = np.clip(atlas * luz_t, 0, 255)
    mar_atlas = agua * (1 - hielo_mar) + np.clip(np.array([240, 244, 250], np.float32) * luz_t, 0, 255) * hielo_mar
    Image.fromarray(np.clip(atlas_t * m + mar_atlas * (1 - m), 0, 255).astype(np.uint8)).save(os.path.join(SALIDA, f"{nombre}_relieve.jpg"), quality=92)
    print("  texturas guardadas", flush=True)
    return {"z": z, "x0": x0, "y0": y0, "ancho": nx * 256, "alto": ny * 256}


def main():
    os.makedirs(SALIDA, exist_ok=True)
    bm_ruta, nubes_ruta = texturas_npm()
    bm = np.asarray(Image.open(bm_ruta).convert("RGB"), dtype=np.float32)
    nubes = os.path.join(SALIDA, "nubes.jpg")
    if not os.path.exists(nubes):
        n = Image.open(nubes_ruta).convert("RGBA")
        a = np.asarray(n, dtype=np.float32)
        gris = (a[..., 3] / 255) * (a[..., :3].mean(-1) / 255)
        Image.fromarray(np.clip(gris * 255, 0, 255).astype(np.uint8), "L").save(nubes, quality=90)
    meta = json.load(open(META)) if os.path.exists(META) else {}
    for nombre in sys.argv[1:] or list(REGIONES):
        meta[nombre] = hacer_region(nombre, bm)
    with open(META, "w") as f:
        json.dump(meta, f, indent=1)
    print("LISTO")


if __name__ == "__main__":
    main()

# Clipper (privado)

Pega un link de YouTube → propone los momentos más repetidos → genera clips editados (vertical, subtítulos, título, velocidad).

## 1. Instalar (una vez, en tu ordenador)

- Python 3 y ffmpeg instalados.
- `pip install -U yt-dlp`

## 2. Arrancar con contraseña

Windows (PowerShell):
```powershell
cd videosmto\clipper
$env:CLIPPER_CLAVE="pon-aqui-tu-clave"
python servidor.py
```

Mac / Linux:
```bash
cd videosmto/clipper
CLIPPER_CLAVE="pon-aqui-tu-clave" python3 servidor.py
```

Al entrar te pide usuario y contraseña: usuario **clipper**, contraseña la que pusiste.

## 3. Abrirlo desde el móvil o cualquier sitio (Tailscale)

1. Crea una cuenta gratis en https://tailscale.com e instala Tailscale en el **ordenador** y en el **móvil**,
   entrando con la misma cuenta en los dos.
2. En el ordenador, con el Clipper ya arrancado, abre otra terminal y ejecuta:
   ```bash
   tailscale serve --bg 8765
   ```
   La primera vez puede darte un enlace para activar HTTPS en tu cuenta: ábrelo, acepta y repite el comando.
3. Te muestra tu dirección, del estilo `https://mi-pc.tailxxxx.ts.net`. Ábrela en el móvil (con Tailscale activado). Guárdala en favoritos.

Solo tus dispositivos de Tailscale pueden abrirla, y además pide la contraseña.
Para dejar de publicarlo: `tailscale serve reset`.

El ordenador tiene que estar encendido y con `servidor.py` en marcha. Los clips se guardan en `clipper/clips/`.

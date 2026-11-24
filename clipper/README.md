# Clipper (privado)

Clipper **en directo**: pega el link de un directo de YouTube, pulsa **Conectar** y luego **Clipear ahora** cada vez que pase algo bueno → corta los últimos 15 s – 2 min y lo edita (vertical, encuadre, título, marca de agua, zoom, barra).

**Modo automático:** elige trozos de 30 s, 1, 2 o 5 min y pulsa *Empezar automático*: graba el directo sin parar y cada trozo se edita solo con los ajustes (por defecto, vertical con fondo desenfocado) y se borra el original. Sigue aunque cierres la página o bloquees el móvil (con `termux-wake-lock`) y para al pulsar *Parar* o tras 3 fallos seguidos. En cada clip, *✨ Hacer vertical* crea una copia en vertical con los ajustes (encuadre, título, marca, zoom, barra). *Clipear ahora* también guarda sin editar salvo que marques «Hacerlo vertical al cortar».

(El servidor conserva también el modo de vídeos normales, `/api/analizar` y `/api/clip`, aunque la página ya no lo muestra.)

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

## 4. En el móvil

- **Como una app:** abre tu dirección de Tailscale y en el menú del navegador pulsa *Añadir a pantalla de inicio*.
- **Pegar:** copia el link en YouTube y pulsa *Pegar* al lado del campo.
- **Compartir…:** cuando un clip está listo, este botón abre el menú del móvil para mandarlo directo a TikTok, Instagram o WhatsApp.
- Mientras genera, la pantalla se mantiene encendida para que no se corte la espera.

## 4b. Instalarlo como app ($SANTORYU$)

Con el servidor en marcha, abre la página en Chrome → menú ⋮ → **Instalar app** (o *Añadir a pantalla de inicio*).
Sale el icono de $SANTORYU$ y se abre a pantalla completa, sin barra del navegador.
La app necesita el servidor encendido (en el ordenador o en Termux); los archivos están en `clipper/app/`.

## 5. Sin ordenador (Android con Termux)

Instalar (una vez): Termux desde F-Droid y luego
`pkg update -y && pkg install -y python ffmpeg git nodejs`, `pip install -U yt-dlp`,
`mkdir -p ~/.config/yt-dlp && echo "--js-runtimes node" > ~/.config/yt-dlp/config` y
`git clone --depth 1 --filter=blob:none --sparse https://github.com/saul4777084-ai/videosmto && cd videosmto && git sparse-checkout set clipper`.

Usar: `termux-wake-lock`, `cd ~/videosmto/clipper && python servidor.py` y abrir http://127.0.0.1:8765 en Chrome.
Actualizar a la última versión: `cd ~/videosmto && git pull`.

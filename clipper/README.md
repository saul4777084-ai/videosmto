# Clipper (privado)

Clipper **en directo**: pega el link de un directo de YouTube, pulsa **Conectar** y luego **Clipear ahora** cada vez que pase algo bueno → corta los últimos 15 s – 2 min y lo edita (vertical, encuadre, título, marca de agua, zoom, barra).

**Modo automático:** elige trozos de 30 s, 1, 2 o 5 min y pulsa *Empezar automático*: graba el directo sin parar y cada clip aparece en cuanto termina, tal cual (horizontal, sin recomprimir: tarda segundos y casi no gasta batería). Si marcas «Hacer vertical cada clip», cada trozo se edita solo con los ajustes y se borra el original. Sigue aunque cierres la página o bloquees el móvil (con `termux-wake-lock`) y para al pulsar *Parar* o tras 3 fallos seguidos. En cada clip, *✨ Hacer vertical* crea una copia en vertical con los ajustes (encuadre, título, marca, zoom, barra). *Clipear ahora* también guarda sin editar salvo que marques «Hacerlo vertical al cortar».

**Subir a TikTok:** cada clip tiene el botón *🎵 Subir a TikTok*. Si el clip ya es vertical, se sube al momento; si es horizontal, primero se hace vertical con tus ajustes y se sube solo en cuanto termina. Se suben de uno en uno, con el texto de la plantilla, y como mucho las que pongas en «Máximo al día» (si llegas al límite, espera y lo sube cuando haya hueco). El estado sale debajo de cada clip (en cola, subiendo, ✅ publicado con enlace o ❌ el error, con botón para reintentar).

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

## 4c. Conectar TikTok (una vez)

1. Entra en https://developers.tiktok.com con tu cuenta, crea una app y añade los productos **Login Kit** y **Content Posting API** (activa *Direct Post*).
2. Pide los permisos `user.info.basic` y `video.publish`.
3. Registra una **Redirect URI**. Lo más cómodo es tu dirección de Tailscale terminada en `/auth/tiktok/vuelta`
   (por ejemplo `https://mi-pc.tailxxxx.ts.net/auth/tiktok/vuelta`): así, al aceptar, TikTok vuelve al Clipper y queda conectado solo.
   Si pones otra web (la de tu marca, por ejemplo), al aceptar copia la dirección completa de la barra (lleva `?code=…`) y pégala en «Usar código».
4. En el Clipper, abre la tarjeta **TikTok**, pega *Client key*, *Client secret* y la *Redirect URI* y pulsa **Conectar con TikTok**.
5. En «Publicación» escribe el texto de los clips (`{titulo}` se cambia por el título del clip o, si no tiene, el del directo), quién los ve y el máximo al día → **Guardar**.

⚠️ Mientras TikTok no **audite** tu app (se pide desde su panel y tarda días o semanas), solo deja publicar en **«Solo yo»** y tu cuenta tiene que estar en **privado**. El Clipper lo detecta y los sube así; cuando aprueben la app saldrán con la privacidad que elegiste sin tocar nada.
TikTok también limita cuántos vídeos se publican al día por API (unos 15): no subas el máximo por encima de eso.
Las claves se guardan en `clipper/tiktok.json`, que no se sube a GitHub. No lo compartas.

## 5. Sin ordenador (Android con Termux)

Instalar (una vez): Termux desde F-Droid y luego
`pkg update -y && pkg install -y python ffmpeg git nodejs`, `pip install -U yt-dlp`,
`mkdir -p ~/.config/yt-dlp && echo "--js-runtimes node" > ~/.config/yt-dlp/config` y
`git clone --depth 1 --filter=blob:none --sparse https://github.com/saul4777084-ai/videosmto && cd videosmto && git sparse-checkout set clipper`.

Usar: `termux-wake-lock`, `cd ~/videosmto/clipper && python servidor.py` y abrir http://127.0.0.1:8765 en Chrome.
Actualizar a la última versión: `cd ~/videosmto && git pull`.

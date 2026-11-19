---
title: Resúmenes de películas
emoji: 🎬
colorFrom: red
colorTo: yellow
sdk: gradio
sdk_version: 6.32.0
python_version: "3.12"
app_file: app.py
pinned: false
---

# 🎬 App de resúmenes de películas (para el móvil)

Desde el móvil subes una película o el trozo que quieras y la app te devuelve un **vídeo vertical
(1080×1920)** con escenas de la película, **voz narrada** (Piper) y **subtítulos** palabra a palabra, además del
texto para publicar (título, descripción y hashtags).

Cómo se usa (gratis):

1. **Paso 1:** subes la película. La app escucha los diálogos con Whisper (o lee tus subtítulos `.srt` si los
   subes, que es mucho más rápido) y te prepara un texto.
2. **Paso 2:** copias ese texto con el botón ⧉, lo pegas en la app de **Claude** y la envías. Claude escribe el
   resumen en español y elige el segundo de la película que se ve con cada frase.
3. **Paso 3:** copias la respuesta de Claude, la pegas en la app y pulsas **Crear vídeo**. Piper pone la voz,
   ffmpeg corta las escenas, las pone en vertical (con la misma imagen desenfocada de fondo), baja el sonido
   original y añade los subtítulos.

Si cierras la página, el trabajo sigue: al volver, la película preparada aparece en el paso 2 y los vídeos
terminados en la pestaña **Mis vídeos**.

> ⚠️ **Copyright:** los vídeos usan escenas de la película. YouTube, TikTok e Instagram suelen poner
> reclamaciones (Content ID): el vídeo puede quedarse sin monetizar, silenciado o bloqueado.

## Ponerla en marcha (todo desde el navegador del móvil, una sola vez)

La app vive gratis en un **Space privado de Hugging Face** (un servidor gratuito: 2 núcleos y 16 GB de memoria).
Solo tú puedes abrirlo.

1. **Hugging Face**: crea una cuenta gratis en <https://huggingface.co/join>. Luego ve a *Settings → Access Tokens →
   Create new token*, elige el tipo **Write** y cópialo.
2. **GitHub**: en este repositorio ve a *Settings → Secrets and variables → Actions → New repository secret*
   (si no ves *Settings*, activa «Versión para ordenador» en el navegador) y crea el secreto
   `HF_TOKEN` con el token de Hugging Face.
3. Ve a la pestaña **Actions** → *Subir la app del móvil a Hugging Face* → abre la última ejecución →
   **Re-run all jobs**. Cuando termine (1 minuto), el registro te da el enlace:
   `https://huggingface.co/spaces/TU_USUARIO/resumenes-peliculas`.
4. Abre ese enlace con la sesión de Hugging Face iniciada. La primera vez tarda unos 5 minutos en prepararse.
   Añádelo a la pantalla de inicio (menú del navegador → «Añadir a pantalla de inicio») y ya lo tienes como una app.

Cada vez que se cambie algo en `app_movil/` y se suba a GitHub, el Space se actualiza solo.

## Consejos

- **Trozos mejor que películas enteras**: subir 2 GB con datos móviles tarda mucho. Con un trozo de 5 a 20
  minutos el resumen sale en pocos minutos. Una película entera puede tardar entre media hora y una hora en el
  servidor gratuito.
- **Si tienes los subtítulos `.srt`**, súbelos en *Más opciones*: se salta la parte de escuchar los diálogos.
- *Más opciones* también te deja cambiar el volumen del sonido original y darle indicaciones al guion
  ("tono de misterio", "no cuentes el final"…).
- El Space gratuito se duerme si no lo usas en 48 horas; al abrirlo tarda un minuto en despertar. Al reiniciarse
  se borran los vídeos guardados en *Mis vídeos*, así que descarga los que quieras conservar.

**Opcional, de pago:** si algún día añades el secreto `ANTHROPIC_API_KEY` (clave de <https://platform.claude.com>),
`motor.py` puede escribir el guion solo, sin copiar y pegar (`python3 motor.py pelicula.mp4`).

## Probarla en un ordenador (opcional)

```bash
cd app_movil
pip install -r requirements.txt gradio==6.32.0     # y ffmpeg instalado
python3 app.py                                      # abre http://localhost:7860
python3 motor.py pelicula.mp4                       # o sin web: imprime el texto para Claude
python3 motor.py pelicula.mp4 --respuesta resp.txt  # y monta el vídeo con su respuesta
```

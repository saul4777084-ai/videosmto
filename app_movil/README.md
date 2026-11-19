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

## Ponerla en marcha (gratis, desde el navegador del móvil)

La app funciona en **GitHub Codespaces**: un ordenador en la nube que GitHub te presta gratis
(unas 60 horas al mes con 2 núcleos y 15 GB de espacio). Solo tú puedes abrirla.

1. Abre este enlace con tu sesión de GitHub iniciada:
   <https://codespaces.new/saul4777084-ai/videosmto?ref=claude/repo-contents-j0woky>
2. Pulsa **Create codespace**. La primera vez tarda unos 5 minutos en instalarlo todo.
3. Cuando termine, la app se abre sola en otra pestaña (si no, mira `COMO_USAR.md`, que se abre en el editor).
   Guarda esa pestaña en favoritos.
4. **Cuando acabes**, apágalo para no gastar horas: <https://github.com/codespaces> → ⋯ → **Stop codespace**.
   Para volver a usarla, entra en esa misma página y toca el nombre de tu Codespace.

Si vas a hacer películas enteras (tardan más), sube el tiempo de apagado automático a 4 horas en
<https://github.com/settings/codespaces> → *Default idle timeout* → `240`.

*(Si algún día pagas Hugging Face PRO, el workflow manual «Subir la app del móvil a Hugging Face» la publica
allí con el secreto `HF_TOKEN`.)*

## Consejos

- **Trozos mejor que películas enteras**: subir 2 GB con datos móviles tarda mucho. Con un trozo de 5 a 20
  minutos el resumen sale en pocos minutos. Una película entera puede tardar entre media hora y una hora en el
  ordenador gratuito de Codespaces.
- **Si tienes los subtítulos `.srt`**, súbelos en *Más opciones*: se salta la parte de escuchar los diálogos.
- *Más opciones* también te deja cambiar el volumen del sonido original y darle indicaciones al guion
  ("tono de misterio", "no cuentes el final"…).
- Los vídeos de *Mis vídeos* se guardan en tu Codespace mientras no lo borres. Descarga los que quieras conservar.

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

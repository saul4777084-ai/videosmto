# Publicador automático (privado)

Publica tus vídeos solo en **TikTok**, **YouTube Shorts** y **Facebook** (Reels de tu página) a las horas que elijas.

- Vigila la carpeta `videos/`. Cada vídeo **nuevo** que aparezca entra solo en la cola.
- En cada hora programada publica **el siguiente vídeo de la cola** en las redes activadas.
- Usa el texto de ese vídeo en `publicaciones/descripciones.md`: el bloque «TikTok / Reels» para TikTok y el bloque «Facebook / YouTube Shorts» para YouTube y Facebook (la primera línea es el título). Puedes cambiarlo en la página antes de que se publique.
- Los vídeos que ya estaban la primera vez que lo arrancas quedan como **antiguo** y no se publican solos. Si quieres subir alguno, pulsa «Poner en cola».
- Si una red falla, las demás siguen. El error queda en el registro, y con «Publicar ahora» se reintenta solo en las que fallaron.

## 1. Arrancar

Solo necesita Python 3: no hay que instalar nada más.

Windows (PowerShell):
```powershell
cd videosmto
$env:PUBLICADOR_CLAVE="pon-aqui-tu-clave"
python publicador\servidor.py
```

Mac / Linux / Termux:
```bash
cd videosmto
PUBLICADOR_CLAVE="pon-aqui-tu-clave" python3 publicador/servidor.py
```

Abre **http://localhost:8790**. Usuario: **publicador**; contraseña: la que pusiste.

**Tiene que quedarse encendido** para publicar a su hora (en Termux, ejecuta antes `termux-wake-lock`).
Opciones: `PUBLICADOR_PUERTO` (8790 por defecto), `PUBLICADOR_VIDEOS` (otra carpeta de vídeos) y
`PUBLICADOR_HOST=0.0.0.0` para abrirlo desde el móvil en tu red (solo con contraseña puesta).

**Primero prueba con «Simulacro»:** hace todo (cola, horarios, textos) menos subir los vídeos.

## 2. Conectar las redes (una sola vez)

Las claves se guardan en `publicador/config.json`, solo en tu aparato. Ese archivo está en `.gitignore`: no se sube a GitHub. No lo compartas.

### YouTube Shorts
1. Entra en https://console.cloud.google.com, crea un proyecto y activa **YouTube Data API v3**.
2. En **Pantalla de consentimiento OAuth**: tipo *Externo*, añade tu correo como **usuario de prueba**.
3. En **Credenciales → Crear credenciales → ID de cliente OAuth → App de escritorio**, copia el *Client ID* y el *Client secret* en la página y pulsa **Guardar**.
4. Pulsa **Conectar con Google** y acepta. Hazlo **en el mismo aparato donde corre el servidor**, porque Google vuelve a `localhost`.

⚠️ Mientras Google no verifique tu app, los vídeos subidos por API quedan **privados**. Para que salgan públicos, pide la verificación (auditoría de la API de YouTube) en la consola de Google.
Cuota gratis: unos 6 vídeos al día.

### TikTok
1. Entra en https://developers.tiktok.com, crea una app y añade los productos **Login Kit** y **Content Posting API** (activa *Direct Post*).
2. Pide los permisos `user.info.basic` y `video.publish`, y registra una **Redirect URI**, por ejemplo la web de tu marca.
3. Copia *Client key*, *Client secret* y esa *Redirect URI* en la página → **Guardar** → **Conectar con TikTok**.
4. Al aceptar, TikTok te lleva a tu Redirect URI con `?code=…` en la barra de direcciones. Si esa página no es el servidor, copia la dirección completa y pégala en «Usar código».

⚠️ Hasta que TikTok **audite** tu app (se pide desde el panel; tarda días o semanas), solo deja publicar en **privado («Solo yo»)**. El publicador lo detecta y lo sube así; cuando aprueben la app, saldrán públicos sin cambiar nada.
El token se renueva solo, pero si pasas más de un año sin usarlo, vuelve a conectar.

### Facebook (Reels de tu página)
1. Entra en https://developers.facebook.com, crea una app de tipo *Empresa* y copia **App ID** y **App secret**.
2. Abre el **Explorador de la API Graph**, elige tu app y genera un *token de usuario* con estos permisos: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` y `publish_video`.
3. Pega App ID, App secret y ese token en la página → **Conectar página**. El publicador lo cambia por un token de página que no caduca. Si administras varias páginas, pon el ID de la que quieras.

Necesitas ser administrador de una **página de Facebook**: no sirve un perfil personal.

## 3. Uso diario
- Renderiza el vídeo, cópialo a `videos/` y escribe su texto en `publicaciones/descripciones.md` con el título `## Nombre — \`videos/archivo.mp4\``.
- El publicador lo detecta en unos 20 segundos y lo pone a la cola. Desde la página puedes cambiar el orden, editar los textos, sacarlo de la cola o publicarlo al momento.
- Cada hora de la lista publica **un** vídeo. Por ejemplo, `13:00, 19:30` son dos vídeos al día.

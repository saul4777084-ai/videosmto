"""Clipper privado: pega un link de YouTube y genera clips. Uso: python servidor.py  (o --test)"""
import base64, glob, hmac, json, math, os, queue, re, shutil, subprocess, sys, threading, time, urllib.request, webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

AQUI = os.path.dirname(os.path.abspath(__file__))
CLIPS = os.path.join(AQUI, "clips")
TRABAJO = os.path.join(AQUI, "trabajo")
CLAVE = os.environ.get("CLIPPER_CLAVE", "")  # vacía = sin contraseña (solo uso en el propio PC)
YTDLP = [sys.executable, "-m", "yt_dlp", "--no-playlist"]
if shutil.which("node"):  # sin un motor de JavaScript, YouTube esconde formatos (los de los directos, entre otros)
    YTDLP += ["--js-runtimes", "node"]


def momentos(heatmap, duracion, n, largo):
    """Elige n tramos sin solapar: picos de 'más repetido' de YouTube o, si no hay, repartidos."""
    if heatmap:
        centros = [(h["start_time"] + h["end_time"]) / 2 for h in sorted(heatmap, key=lambda h: -h["value"])]
    else:
        centros = [duracion * (i + 1) / (n + 1) for i in range(n)]
    elegidos = []
    for c in centros:
        ini = min(max(0, c - largo / 2), max(0, duracion - largo))
        if all(abs(ini - e) >= largo for e in elegidos):
            elegidos.append(ini)
        if len(elegidos) == n:
            break
    return [[round(i, 1), round(min(i + largo, duracion), 1)] for i in sorted(elegidos)]


def leer_srt(texto):
    cues = []
    for b in re.split(r"\n\s*\n", texto.replace("\r", "").strip()):
        m = re.search(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)", b)
        if not m:
            continue
        g = list(map(int, m.groups()))
        cues.append((g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000,
                     g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000, b[m.end():].strip()))
    return cues


def ajustar(cues, ini, fin, margen=3.0):
    """Lleva inicio y fin al cambio de frase más cercano (hasta 'margen' s) para no cortar a media frase."""
    bordes = sorted({a for a, _, _ in cues})
    cerca = lambda x: min((b for b in bordes if abs(b - x) <= margen), key=lambda b: abs(b - x), default=x)
    a, z = cerca(ini), cerca(fin)
    return (round(a, 2), round(z, 2)) if z - a >= 1 else (ini, fin)


def recortar_srt(cues, ini, fin, palabras=0, mayus=False):
    """Cues dentro de [ini, fin] desplazados a tiempo del clip. Quita repetidos de los subtítulos automáticos.
    palabras>0 parte cada frase en trozos de ese tamaño (estilo TikTok), repartiendo el tiempo por letras."""
    t = lambda s: "%02d:%02d:%02d,%03d" % (s // 3600, s % 3600 // 60, s % 60, round(s % 1 * 1000) % 1000)
    frases, previo = [], None
    for a, z, txt in cues:
        txt = txt.splitlines()[-1] if txt else ""  # shortcut: los auto-subs repiten la línea anterior; nos quedamos con la última
        if z <= ini or a >= fin or z - a < 0.05 or not txt or txt == previo:
            continue
        previo = txt
        frases.append([max(a, ini) - ini, min(z, fin) - ini, txt])
    for i in range(len(frases) - 1):  # los auto-subs se solapan: así nunca salen dos frases a la vez
        frases[i][1] = min(frases[i][1], frases[i + 1][0])
    trozos = []
    for a, z, txt in frases:
        if mayus:
            txt = txt.upper()
        ws = txt.split()
        grupos = [" ".join(ws[i:i + palabras]) for i in range(0, len(ws), palabras)] if palabras else [txt]
        total, dur = sum(len(g) for g in grupos), z - a
        for g in grupos:
            d = dur * len(g) / total
            trozos.append([a, a + d, g])
            a += d
    return "\n".join(f"{i}\n{t(a)} --> {t(z)}\n{x}\n" for i, (a, z, x) in enumerate(trozos, 1))


FORMATOS = {
    "vertical": "[0:v]crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':'(iw-ow)*{k}':'(ih-oh)/2',scale=1080:1920:flags=lanczos",
    # fondo: se desenfoca a 270x480 y se amplía (3 veces más rápido que desenfocar a 1080x1920 y se ve igual)
    "desenfocado": "[0:v]split[a][b];[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,"
                   "boxblur=6,scale=1080:1920[f];[b]scale=1080:-2:flags=lanczos[p];[f][p]overlay=(W-w)/2:(H-h)/2",
    "original": "[0:v]null",
}
# altura máxima que se descarga, crf, preset. En vertical se recorta ~1/3 del ancho: hace falta fuente alta para que no salga borroso
CALIDADES = {"rapida": (720, 26, "veryfast"), "buena": (1080, 20, "veryfast"), "maxima": (2160, 18, "medium")}
TAMANOS = {"pequeno": 12, "mediano": 16, "grande": 22}
COLORES = {"blanco": "&H00FFFFFF", "amarillo": "&H0000E5FF", "verde": "&H0066FF33"}  # ASS: &HAABBGGRR
POSICIONES = {"abajo": 2, "centro": 5, "arriba": 8}


def filtro(d, nombre, dur, srt):
    """Cadena de filtros de ffmpeg de un clip. No descarga nada, así que test() la prueba sola."""
    formato = d.get("formato") if d.get("formato") in FORMATOS else "vertical"
    k = min(max(float(d.get("encuadre", 0.5)), 0.0), 1.0)
    # fps=30 lo primero: los directos de juegos van a 60 fps y así cada filtro trabaja la mitad
    f = FORMATOS[formato].replace("{k}", str(k)).replace("[0:v]", "[0:v]fps=30,", 1)
    if formato != "original" and d.get("zoom"):  # zoom suave hasta +8 % al final del clip
        f += f",scale=w='trunc(540*(1+0.08*t/{dur:.2f}))*2':h=-2:eval=frame:flags=bicubic,crop=1080:1920"
    if srt:
        pos = d.get("sub_posicion") if d.get("sub_posicion") in POSICIONES else "abajo"
        margen = {"abajo": 70 if formato != "original" else 20, "centro": 0, "arriba": 40}[pos]
        tam = TAMANOS.get(d.get("sub_tamano"), 16) + (4 if d.get("sub_estilo") == "tiktok" else 0)
        f += (f",subtitles={nombre}.srt:force_style='FontName=Arial,FontSize={tam},Bold=1,Outline=3,"
              f"PrimaryColour={COLORES.get(d.get('sub_color'), COLORES['blanco'])},"
              f"Alignment={POSICIONES[pos]},MarginV={margen}'")
    # shortcut: drawtext usa la fuente por defecto de fontconfig; en Windows sin fontconfig añade fontfile=
    if str(d.get("titulo", "")).strip():
        f += f",drawtext=textfile={nombre}.titulo.txt:expansion=none:fontsize=h/24:fontcolor=white:borderw=5:x=(w-tw)/2:y=h*0.08"
    if str(d.get("marca", "")).strip():
        f += f",drawtext=textfile={nombre}.marca.txt:expansion=none:fontsize=h/40:fontcolor=white@0.6:borderw=2:x=(w-tw)/2:y=h*0.93"
    if d.get("barra"):
        f += f",drawbox=x=0:y=ih-ih/120:w='iw*t/{dur:.2f}':h=ih/120:color=white@0.85:t=fill"
    return f


def analizar(url):
    info = json.loads(run(YTDLP + ["-J", "--", url]).stdout)
    return info


def subtitulos(url, vid):
    """Subtítulos del vídeo (se descargan una vez y se reutilizan). Lista de cues o []."""
    srts = glob.glob(os.path.join(TRABAJO, vid + ".*.srt"))
    if not srts:
        run(YTDLP + ["--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "es.*,en.*,.*-orig",
                     "--convert-subs", "srt", "-o", os.path.join(TRABAJO, vid), "--", url], check=False)
        srts = glob.glob(os.path.join(TRABAJO, vid + ".*.srt"))
    if not srts:
        return []
    # español reconocido del audio > español > otro idioma reconocido del audio > el resto
    srts.sort(key=lambda p: (0 if ".es-orig." in p else 1 if ".es." in p else 2 if "-orig." in p else 3, len(p)))
    with open(srts[0], encoding="utf-8") as f:
        return leer_srt(f.read())


def generar(d):
    url, ini, fin = d["url"], float(d["inicio"]), float(d["fin"])
    vel = min(max(float(d.get("velocidad", 1)), 0.5), 2.0)
    if not 0 <= ini < fin or fin - ini > 600:
        raise ValueError("Tramo inválido (máx. 10 min)")
    vid = re.sub(r"\W", "", d.get("id", "video"))[:20] or "video"
    alto, crf, preset = CALIDADES.get(d.get("calidad"), CALIDADES["buena"])
    os.makedirs(TRABAJO, exist_ok=True); os.makedirs(CLIPS, exist_ok=True)
    cues = subtitulos(url, vid) if d.get("subtitulos") or d.get("ajustar", True) else []
    if d.get("ajustar", True) and cues:
        ini, fin = ajustar(cues, ini, fin)
    nombre = f"{vid}_{int(ini)}_{int(time.time())}"
    tramo = os.path.join(TRABAJO, nombre + ".mp4")
    run(YTDLP + ["-f", f"bv*[height<={alto}]+ba/b[height<={alto}]/b", "--merge-output-format", "mp4",
                 "--force-keyframes-at-cuts", "--download-sections", f"*{ini}-{fin}", "-o", tramo, "--", url])
    srt = ""
    if d.get("subtitulos") and cues:
        tiktok = d.get("sub_estilo") == "tiktok"
        srt = recortar_srt(cues, ini, fin, palabras=3 if tiktok else 0, mayus=tiktok)
    return dict(editar(d, nombre, nombre + ".mp4", fin - ini, srt), inicio=ini, fin=fin)


def segmentos_atras(lista, segundos):
    """Cuántos segmentos de una lista HLS en directo hay que retroceder para tener los últimos 'segundos'."""
    m = re.search(r"#EXT-X-TARGETDURATION:(\d+(?:\.\d+)?)", lista)
    return math.ceil(segundos / float(m.group(1) if m else 5)) + 1


def generar_directo(d):
    """Clip de los últimos N segundos de un directo, como el botón «Clip» de Twitch.
    Sin «editar» solo se copia (segundos); con «editar» se pasa a vertical con efectos (lento en el móvil)."""
    nombre, entrada, seg = capturar_directo(d)
    if d.get("editar"):
        return editar(d, nombre, entrada, seg, "")
    run(["ffmpeg", "-y", "-v", "error", "-i", entrada, "-c", "copy", "-movflags", "+faststart",
         os.path.join(CLIPS, nombre + ".mp4")], cwd=TRABAJO)
    os.remove(os.path.join(TRABAJO, entrada))
    return {"archivo": "/clips/" + nombre + ".mp4"}


URLS = {}  # (url, altura) -> (hora, [URL HLS]): extraer en el móvil tarda mucho y las URL valen horas


def info_directo(url, alto):
    """Datos del vídeo; si está en directo, guarda sus URL HLS para los clips."""
    hls = "[protocol^=m3u8]"
    # vídeo y audio juntos o, si YouTube los da por separado, uno de cada (dos URL)
    info = json.loads(run(YTDLP + ["-J", "--ignore-no-formats-error", "-f",
                                   f"b{hls}[height<={alto}]/b{hls}/bv*{hls}[height<={alto}]+ba{hls}/bv*{hls}+ba{hls}",
                                   "--", url]).stdout)
    urls = [f["url"] for f in info.get("requested_formats") or [info] if f.get("url")]
    if info.get("is_live"):
        if not urls:
            raise ValueError("YouTube no ha dado el vídeo de este directo. En Termux comprueba que «node --version» "
                             "funciona y actualiza con «pip install -U yt-dlp»; luego vuelve a arrancar el Clipper.")
        URLS[(url, alto)] = (time.time(), urls)
    return info


def urls_directo(url, alto, nuevas=False):
    guardadas = URLS.get((url, alto))
    if nuevas or not guardadas or time.time() - guardadas[0] > 3600:
        if not info_directo(url, alto).get("is_live"):
            raise ValueError("El directo ha terminado.")
        guardadas = URLS[(url, alto)]
    return guardadas[1]


def capturar_directo(d):
    """Copia (sin editar, tarda segundos) los últimos N segundos del directo a TRABAJO."""
    url, seg = d["url"], min(max(float(d.get("segundos", 60)), 5), 300)
    vid = re.sub(r"\W", "", d.get("id", "directo"))[:20] or "directo"
    alto = CALIDADES.get(d.get("calidad"), CALIDADES["buena"])[0]
    os.makedirs(TRABAJO, exist_ok=True); os.makedirs(CLIPS, exist_ok=True)
    for intento in (0, 1):
        try:
            urls, entradas = urls_directo(url, alto, nuevas=intento == 1), []
            for u in urls:
                with urllib.request.urlopen(u, timeout=20) as r:
                    lista = r.read().decode("utf-8", "replace")
                # si el directo no deja ir atrás, ffmpeg empieza en lo más antiguo que haya y graba hasta completar
                entradas += ["-live_start_index", str(-segmentos_atras(lista, seg)), "-i", u]
            nombre = f"{vid}_directo_{int(time.time())}"
            run(["ffmpeg", "-y", *entradas, "-t", str(seg), "-map", "0:v:0", "-map", f"{len(urls) - 1}:a:0?",
                 "-c", "copy", "-f", "mpegts", nombre + ".ts"], cwd=TRABAJO)
            return nombre, nombre + ".ts", seg
        except (RuntimeError, OSError):  # URL caducada (403, etc.): se piden otras a YouTube una vez
            if intento:
                raise


# Modo automático: un solo ffmpeg graba el directo sin parar y lo parte en clips seguidos sin recomprimir
# (casi sin gastar CPU); cada clip pasa a CLIPS en cuanto se cierra. Sigue aunque se cierre la página.
# Editar (vertical, efectos) va aparte, solo en los clips que se pidan, con una cola de uno en uno.
AUTO = {"activo": False, "cada": 60, "hechos": 0, "error": "", "url": "", "titulo": ""}
COLA, PARAR, HILO = queue.Queue(), threading.Event(), [None]


def mover_terminados(lista):
    """Pasa a CLIPS los trozos que ffmpeg ya cerró (los apunta en la lista al terminar cada uno)."""
    if not os.path.exists(lista):
        return
    with open(lista, encoding="utf-8") as f:
        for linea in f:
            p = os.path.join(TRABAJO, os.path.basename(linea.split(",")[0].strip()))
            if linea.strip() and os.path.isfile(p):
                os.replace(p, os.path.join(CLIPS, os.path.basename(p)))
                AUTO["hechos"] += 1


def bucle_auto(d):
    cada, fallos = AUTO["cada"], 0
    alto = CALIDADES.get(d.get("calidad"), CALIDADES["buena"])[0]
    vid = re.sub(r"\W", "", d.get("id", "directo"))[:20] or "directo"
    os.makedirs(TRABAJO, exist_ok=True); os.makedirs(CLIPS, exist_ok=True)
    while not PARAR.is_set():
        try:
            urls = urls_directo(d["url"], alto, nuevas=fallos > 0)
        except Exception as e:
            urls, error = None, str(e)
        if urls:
            lista = os.path.join(TRABAJO, f"{vid}_{int(time.time())}.csv")
            proc = subprocess.Popen(
                ["ffmpeg", "-y", "-v", "error", *[x for u in urls for x in ("-i", u)], "-map", "0:v:0",
                 "-map", f"{len(urls) - 1}:a:0?", "-c", "copy", "-f", "segment", "-segment_time", str(cada),
                 "-reset_timestamps", "1", "-segment_format_options", "movflags=+faststart",
                 "-segment_list", lista, "-segment_list_type", "csv", "-strftime", "1",
                 os.path.join(TRABAJO, f"{vid}_%Y%m%d-%H%M%S.mp4")],
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, errors="replace")
            inicio = time.time()
            while proc.poll() is None and not PARAR.wait(2):
                mover_terminados(lista)
            if PARAR.is_set():
                proc.terminate()  # ffmpeg cierra bien el trozo que estaba grabando, que también se guarda
            error = (proc.communicate()[1].strip().splitlines() or ["el directo dejó de llegar"])[-1]
            mover_terminados(lista)
            os.remove(lista) if os.path.exists(lista) else None
            if PARAR.is_set():
                break
            if time.time() - inicio > 120:  # grabó un buen rato: es un corte puntual, no un fallo seguido
                fallos = 0
        fallos += 1
        AUTO["error"] = error
        if fallos >= 3:
            AUTO["error"] = "Parado: el directo ha terminado o no responde (" + error + ")"
            break
        PARAR.wait(3)
    AUTO["activo"] = False


def editor():
    while True:
        d, nombre, entrada, seg = COLA.get()
        try:
            editar(d, nombre, entrada, seg, "")
        except Exception as e:
            AUTO["error"] = "No se pudo hacer vertical un clip: " + str(e)


def pedir_vertical(d):
    """Encola la edición (vertical, efectos) de un clip ya guardado; el resultado sale como clip nuevo."""
    p = os.path.join(CLIPS, os.path.basename(str(d.get("archivo", ""))))  # basename: sin salir de clips/
    if not (p.endswith(".mp4") and os.path.isfile(p)):
        raise ValueError("Ese clip ya no existe.")
    dur = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout.strip())
    os.makedirs(TRABAJO, exist_ok=True)
    COLA.put((d, os.path.basename(p)[:-4] + "_vertical_" + str(int(time.time())), p, dur))


def estado_auto():
    return dict(AUTO, en_cola=COLA.qsize())


def lista_clips():
    clips = [p for p in glob.glob(os.path.join(CLIPS, "*.mp4"))]
    clips.sort(key=os.path.getmtime, reverse=True)
    return [{"archivo": "/clips/" + os.path.basename(p), "hora": os.path.getmtime(p),
             "mb": round(os.path.getsize(p) / 1e6, 1)} for p in clips[:200]]


def editar(d, nombre, entrada, dur, srt):
    """Pasa el tramo descargado (en TRABAJO) por formato, subtítulos y efectos, y lo deja en CLIPS."""
    vel = min(max(float(d.get("velocidad", 1)), 0.5), 2.0)
    crf, preset = CALIDADES.get(d.get("calidad"), CALIDADES["buena"])[1:]
    for ext, texto in ((".srt", srt), (".titulo.txt", str(d.get("titulo", "")).strip()[:80]),
                       (".marca.txt", str(d.get("marca", "")).strip()[:40])):
        if texto:
            with open(os.path.join(TRABAJO, nombre + ext), "w", encoding="utf-8") as f:
                f.write(texto)
    cadena = filtro(d, nombre, dur, bool(srt)) + f",setpts=PTS/{vel}[v]"
    salida = os.path.join(TRABAJO, nombre + ".listo.mp4")  # a CLIPS solo cuando está terminado
    # cwd=TRABAJO para pasar nombres relativos a los filtros (evita escapar rutas con ':' en Windows)
    run(["ffmpeg", "-y", "-i", entrada, "-filter_complex", cadena, "-map", "[v]", "-map", "0:a?",
         "-af", f"atempo={vel}", "-c:v", "libx264", "-crf", str(crf), "-preset", preset, "-c:a", "aac",
         "-movflags", "+faststart", salida], cwd=TRABAJO)
    os.replace(salida, os.path.join(CLIPS, nombre + ".mp4"))
    for p in glob.glob(os.path.join(TRABAJO, nombre + ".*")):
        os.remove(p)
    return {"archivo": "/clips/" + nombre + ".mp4"}


def run(cmd, check=True, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=cwd)
    if check and r.returncode:
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "fallo en " + cmd[0])
    return r


class App(BaseHTTPRequestHandler):
    def responder(self, code, cuerpo, tipo="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")  # que el navegador del móvil no enseñe una versión vieja
        self.end_headers()
        self.wfile.write(cuerpo)

    def autorizado(self):
        if not CLAVE:
            return True
        esperado = "Basic " + base64.b64encode(b"clipper:" + CLAVE.encode()).decode()
        if hmac.compare_digest(self.headers.get("Authorization", ""), esperado):
            return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Clipper"')
        self.send_header("Content-Length", "0")
        self.end_headers()
        return False

    def do_GET(self):
        if not self.autorizado():
            return
        if self.path.split("?")[0] == "/":
            with open(os.path.join(AQUI, "index.html"), "rb") as f:
                return self.responder(200, f.read(), "text/html; charset=utf-8")
        if self.path.startswith("/clips/"):
            p = os.path.join(CLIPS, os.path.basename(self.path))  # basename: sin salir de clips/
            if os.path.isfile(p):
                with open(p, "rb") as f:
                    return self.responder(200, f.read(), "video/mp4")
        if self.path == "/api/clips":
            return self.responder(200, json.dumps(lista_clips()).encode())
        if self.path == "/api/auto":
            return self.responder(200, json.dumps(estado_auto()).encode())
        self.responder(404, b"{}")

    def do_POST(self):
        if not self.autorizado():
            return
        try:
            d = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            if self.path == "/api/borrar":
                p = os.path.join(CLIPS, os.path.basename(str(d.get("archivo", ""))))  # basename: sin salir de clips/
                if p.endswith(".mp4") and os.path.isfile(p):
                    os.remove(p)
                return self.responder(200, json.dumps(lista_clips()).encode())
            if self.path == "/api/auto" and d.get("accion") == "parar":
                PARAR.set()
                if HILO[0]:
                    HILO[0].join(timeout=90)  # deja cerrar bien el trozo que se está grabando
                return self.responder(200, json.dumps(estado_auto()).encode())
            if self.path == "/api/vertical":  # no necesita link: trabaja sobre un clip ya guardado
                pedir_vertical(d)
                return self.responder(200, json.dumps(estado_auto()).encode())
            if not re.match(r"^https?://", str(d.get("url", ""))):
                raise ValueError("Pega un link http(s) válido")
            if self.path == "/api/auto":
                if AUTO["activo"] or (HILO[0] and HILO[0].is_alive()):
                    raise ValueError("El modo automático ya está en marcha.")
                PARAR.clear()
                AUTO.update(activo=True, cada=min(max(float(d.get("cada", 60)), 15), 300), hechos=0, error="",
                            url=d["url"], titulo=str(d.get("titulo_directo", ""))[:200])
                HILO[0] = threading.Thread(target=bucle_auto, args=(d,), daemon=True)
                HILO[0].start()
                res = estado_auto()
            elif self.path == "/api/analizar":
                info = analizar(d["url"])
                dur = float(info.get("duration") or 0)
                if info.get("is_live") or info.get("live_status") in ("is_live", "is_upcoming", "post_live"):
                    raise ValueError("Este video es un directo que aún no ha terminado (o YouTube lo está procesando). "
                                     "Cuando acabe el directo, espera un rato y vuelve a probar.")
                if not dur:
                    raise ValueError("YouTube no dice cuánto dura este video. Prueba con otro enlace.")
                res = {"id": info["id"], "titulo": info.get("title"), "duracion": dur,
                       "picos": bool(info.get("heatmap")),
                       "clips": momentos(info.get("heatmap"), dur, int(d.get("n", 5)), float(d.get("largo", 45)))}
            elif self.path == "/api/directo":
                info = info_directo(d["url"], CALIDADES.get(d.get("calidad"), CALIDADES["buena"])[0])
                if not info.get("is_live"):
                    raise ValueError("Este video no está en directo ahora mismo. Pega el enlace de un directo que se esté emitiendo.")
                res = {"id": info["id"], "titulo": info.get("title")}
            elif self.path == "/api/clip_directo":
                res = generar_directo(d)
            elif self.path == "/api/clip":
                res = generar(d)
            else:
                return self.responder(404, b"{}")
            self.responder(200, json.dumps(res).encode())
        except Exception as e:
            self.responder(400, json.dumps({"error": str(e)}).encode())


def test():
    hm = [{"start_time": i * 10, "end_time": i * 10 + 10, "value": v} for i, v in enumerate([0.1, 0.9, 0.2, 1.0, 0.3, 0.1])]
    assert momentos(hm, 60, 2, 20) == [[5.0, 25.0], [25.0, 45.0]], momentos(hm, 60, 2, 20)
    assert momentos(None, 100, 3, 10) == [[20.0, 30.0], [45.0, 55.0], [70.0, 80.0]]
    assert momentos(hm, 60, 5, 100) == [[0, 60.0]]  # clip más largo que el vídeo
    srt = "1\n00:00:09,000 --> 00:00:11,500\nhola\n\n2\n00:00:11,500 --> 00:00:11,510\nhola\n\n" \
          "3\n00:00:11,510 --> 00:00:14,000\nhola\nmundo\n\n4\n00:00:30,000 --> 00:00:31,000\nfuera\n"
    assert recortar_srt(leer_srt(srt), 10, 20) == \
        "1\n00:00:00,000 --> 00:00:01,500\nhola\n\n2\n00:00:01,510 --> 00:00:04,000\nmundo\n"
    assert ajustar(leer_srt(srt), 10, 29) == (9.0, 30.0)   # a los cambios de frase cercanos
    assert ajustar(leer_srt(srt), 100, 120) == (100, 120)   # sin frases cerca: no toca nada
    tik = recortar_srt(leer_srt("1\n00:00:00,000 --> 00:00:03,000\nuno dos tres cuatro\n\n"
                                "2\n00:00:02,000 --> 00:00:04,000\nfin\n"), 0, 10, palabras=3, mayus=True)
    assert tik == ("1\n00:00:00,000 --> 00:00:01,333\nUNO DOS TRES\n\n2\n00:00:01,333 --> 00:00:02,000\nCUATRO\n\n"
                   "3\n00:00:02,000 --> 00:00:04,000\nFIN\n"), tik
    assert segmentos_atras("#EXTM3U\n#EXT-X-TARGETDURATION:5\n", 60) == 13
    assert segmentos_atras("#EXTM3U\n#EXT-X-TARGETDURATION:2\n", 30) == 16
    assert segmentos_atras("sin cabecera", 10) == 3
    # la cadena de filtros completa funciona en ffmpeg con un vídeo de prueba
    import shutil, tempfile
    if shutil.which("ffmpeg"):
        tmp = tempfile.mkdtemp()
        for ext, x in ((".srt", "1\n00:00:00,000 --> 00:00:01,000\nHOLA\n"), (".titulo.txt", "Título"), (".marca.txt", "@yo")):
            open(os.path.join(tmp, "t" + ext), "w", encoding="utf-8").write(x)
        d = {"formato": "vertical", "encuadre": 0.25, "zoom": True, "barra": True, "titulo": "x", "marca": "y",
             "sub_estilo": "tiktok", "sub_color": "amarillo", "sub_posicion": "centro"}
        r = subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=1920x1080:d=2", "-filter_complex",
                            filtro(d, "t", 2, True) + ",setpts=PTS/1.25[v]", "-map", "[v]", "-f", "null", "-"],
                           cwd=tmp, capture_output=True, text=True)
        assert r.returncode == 0, r.stderr
        shutil.rmtree(tmp)
    print("ok")


if __name__ == "__main__":
    if "--test" in sys.argv:
        test(); sys.exit()
    puerto = 8765
    print(f"Clipper en http://127.0.0.1:{puerto}  (Ctrl+C para salir)")
    print("Contraseña activada (usuario: clipper)" if CLAVE else "Sin contraseña: no lo publiques con Tailscale")
    threading.Thread(target=editor, daemon=True).start()
    webbrowser.open(f"http://127.0.0.1:{puerto}")
    ThreadingHTTPServer(("127.0.0.1", puerto), App).serve_forever()

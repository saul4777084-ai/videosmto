"""Clipper privado: pega un link de YouTube y genera clips. Uso: python servidor.py  (o --test)"""
import base64, glob, hmac, json, math, os, queue, re, shutil, subprocess, sys, threading, time, urllib.parse, urllib.request, webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import tiktok

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
# ultrafast: «Hacer vertical» tarda ~40 % menos que con veryfast; el crf algo más alto compensa el peso del archivo
CALIDADES = {"baja": (480, 27, "ultrafast"), "rapida": (720, 27, "ultrafast"), "buena": (1080, 20, "ultrafast"), "maxima": (2160, 18, "veryfast")}
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
    run(["ffmpeg", "-y", "-v", "error", "-ss", str(inicio_video(os.path.join(TRABAJO, entrada))), "-i", entrada, "-c", "copy", "-movflags", "+faststart",
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


def trozos(texto, base):
    """(número del primer trozo, [(duración, URL)], línea EXT-X-MAP o "") de una lista HLS."""
    m = re.search(r"#EXT-X-MEDIA-SEQUENCE:(\d+)", texto)
    segs, dur, mapa = [], None, ""
    for l in texto.splitlines():
        l = l.strip()
        if l.startswith("#EXTINF:"):
            dur = float(l[8:].split(",")[0])
        elif l.startswith("#EXT-X-MAP:"):
            mapa = re.sub(r'URI="([^"]+)"', lambda x: f'URI="{urllib.parse.urljoin(base, x.group(1))}"', l)
        elif l and not l.startswith("#") and dur is not None:
            segs.append((dur, urllib.parse.urljoin(base, l)))
            dur = None
    return (int(m.group(1)) if m else None), segs, mapa


def tramo_comun(listas, seg):
    """Vídeo y audio vienen en listas separadas: el mismo número de trozo es el mismo momento del directo.
    Devuelve (primer trozo, trozo final exclusivo) comunes a todas que cubren los últimos 'seg' segundos, o None."""
    if any(seq is None or not segs for seq, segs, _ in listas):
        return None
    ini0, fin = max(seq for seq, _, _ in listas), min(seq + len(segs) for seq, segs, _ in listas)
    seq_v, segs_v, _ = listas[0]
    ini, total = fin, 0.0
    while ini > ini0 and total < seg:
        ini -= 1
        total += segs_v[ini - seq_v][0]
    return (ini, fin) if ini < fin else None


def lista_local(info, ini, fin, ruta):
    """Lista HLS cerrada (como un vídeo normal) con los trozos [ini, fin) de una pista."""
    seq, segs, mapa = info
    elegidos = segs[ini - seq:fin - seq]
    lineas = ["#EXTM3U", "#EXT-X-VERSION:6", f"#EXT-X-TARGETDURATION:{math.ceil(max(d for d, _ in elegidos))}",
              f"#EXT-X-MEDIA-SEQUENCE:{ini}"] + ([mapa] if mapa else [])
    for d, u in elegidos:
        lineas += [f"#EXTINF:{d:.3f},", u]
    with open(ruta, "w", encoding="utf-8") as f:
        f.write("\n".join(lineas + ["#EXT-X-ENDLIST", ""]))


def capturar_directo(d):
    """Copia (sin editar, tarda segundos) los últimos N segundos del directo a TRABAJO."""
    url, seg = d["url"], min(max(float(d.get("segundos", 60)), 5), 300)
    vid = re.sub(r"\W", "", d.get("id", "directo"))[:20] or "directo"
    alto = CALIDADES.get(d.get("calidad"), CALIDADES["buena"])[0]
    os.makedirs(TRABAJO, exist_ok=True); os.makedirs(CLIPS, exist_ok=True)
    for intento in (0, 1):
        try:
            urls, entradas, textos = urls_directo(url, alto, nuevas=intento == 1), [], []
            for u in urls:
                with urllib.request.urlopen(u, timeout=20) as r:
                    textos.append(r.read().decode("utf-8", "replace"))
            nombre = f"{vid}_directo_{int(time.time())}"
            listas = [trozos(t, u) for t, u in zip(textos, urls)]
            DIAG["listas"] = [(seq, len(segs)) for seq, segs, _ in listas]
            comun = tramo_comun(listas, seg) if len(urls) > 1 else None
            if comun:  # vídeo y audio aparte: los dos desde el mismo trozo, si no salen desfasados
                for k, info in enumerate(listas):
                    lista_local(info, *comun, os.path.join(TRABAJO, f"{nombre}_{k}.m3u8"))
                    entradas += ["-protocol_whitelist", "file,http,https,tcp,tls,crypto", "-i", f"{nombre}_{k}.m3u8"]
            else:
                for t, u in zip(textos, urls):
                    # si el directo no deja ir atrás, ffmpeg empieza en lo más antiguo que haya y graba hasta completar
                    entradas += ["-live_start_index", str(-segmentos_atras(t, seg)), "-i", u]
            run(["ffmpeg", "-y", *entradas, "-t", str(seg), "-map", "0:v:0", "-map", f"{len(urls) - 1}:a:0?",
                 "-c", "copy", "-f", "mpegts", nombre + ".ts"], cwd=TRABAJO)
            for p in glob.glob(os.path.join(TRABAJO, nombre + "_*.m3u8")):
                os.remove(p)
            return nombre, nombre + ".ts", seg
        except (RuntimeError, OSError):  # URL caducada (403, etc.): se piden otras a YouTube una vez
            if intento:
                raise


# Modo automático: el programa lee las listas de trozos del directo y, cada vez que hay trozos nuevos para un clip,
# baja esos mismos números de trozo de vídeo y de audio (así van siempre a la par) sin recomprimir. Sigue aunque se
# cierre la página. Editar (vertical, efectos) va aparte, con una cola de uno en uno.
AUTO = {"activo": False, "cada": 60, "hechos": 0, "error": "", "url": "", "titulo": "", "alto": 0, "alto_max": 0, "aviso": ""}

# Calidad del automático: baja si la conexión no da y vuelve a subir sola cuando se recupera.
NIVELES = (480, 720, 1080, 2160)
VENTANA, ESPERA_MIN, ESPERA_MAX = 600, 300, 1800  # s: ventana de pérdidas, espera antes de probar a subir


def nueva_calidad(alto):
    return {"alto": alto, "max": alto, "perdidas": [], "subir_a": None, "espera": ESPERA_MIN, "subido_en": None}


def calidad_tras_perdida(c, ahora):
    """Se perdieron trozos. Baja un nivel si es la segunda pérdida en 10 min o si acaba de subir de nivel
    (una pérdida suelta es un bajón puntual y no merece perder calidad). Devuelve True si bajó."""
    c["perdidas"] = [t for t in c["perdidas"] if ahora - t < VENTANA] + [ahora]
    probando = c["subido_en"] is not None and ahora - c["subido_en"] < VENTANA
    if c["alto"] <= NIVELES[0] or (len(c["perdidas"]) < 2 and not probando):
        return False
    # si falla justo después de subir, la próxima prueba espera el doble (hasta 30 min)
    c["espera"] = min(c["espera"] * 2, ESPERA_MAX) if probando else ESPERA_MIN
    c["alto"] = max(n for n in NIVELES if n < c["alto"])
    c["perdidas"], c["subido_en"], c["subir_a"] = [], None, ahora + c["espera"]
    return True


def calidad_tras_espera(c, ahora):
    """Si toca, sube un nivel (sin pasar de la calidad elegida). Devuelve True si subió."""
    if c["alto"] >= c["max"] or c["subir_a"] is None or ahora < c["subir_a"]:
        return False
    c["alto"] = min(n for n in NIVELES if n > c["alto"])
    c["subido_en"], c["perdidas"] = ahora, []
    c["subir_a"] = ahora + c["espera"] if c["alto"] < c["max"] else None
    return True


def aviso_calidad(c):
    if c["alto"] >= c["max"]:
        return ""
    prueba = time.strftime(" · a las %H:%M prueba a subir", time.localtime(c["subir_a"])) if c["subir_a"] else ""
    return f"Calidad bajada a {c['alto']}p por la conexión{prueba}"
COLA, PARAR, HILO = queue.Queue(), threading.Event(), [None]


def avisar_si_va_lento(p):
    """Con vídeo y audio por separado, si la conexión no da (o YouTube frena el vídeo), el vídeo llega más
    despacio que el audio: el clip sale congelado y desfasado. Se ve comparando lo que dura cada pista."""
    dur = {}
    for linea in run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,duration", "-of", "csv=p=0", p],
                     check=False).stdout.split():
        tipo, _, v = linea.partition(",")
        try:
            dur[tipo] = float(v)
        except ValueError:
            pass
    if dur.get("audio", 0) > 5 and dur.get("video", 0) < 0.8 * dur["audio"]:
        AUTO["error"] = (f"El vídeo llega más lento que el audio ({dur.get('video', 0):.0f} s de vídeo por {dur['audio']:.0f} s de audio): "
                         "tu conexión no da para esta calidad. Para el automático, elige Calidad Rápida (720p) o Baja (480p) "
                         "y vuelve a empezar.")


DIAG = {"pistas": 0, "ultimas": [], "listas": []}


def huecos(p, tipo):
    """(inicio, duración, huecos > 0,3 s, mayor hueco) de la pista de vídeo (v) o audio (a) de un archivo."""
    ts = []
    for x in run(["ffprobe", "-v", "error", "-select_streams", f"{tipo}:0", "-show_entries", "packet=pts_time",
                  "-of", "csv=p=0", p], check=False).stdout.split():
        try:
            ts.append(float(x.strip(",")))
        except ValueError:
            pass
    if not ts:
        return "sin pista"
    ts.sort()
    saltos = [b - a for a, b in zip(ts, ts[1:])]
    return (f"empieza {ts[0]:.2f} s, dura {ts[-1] - ts[0]:.1f} s, huecos >0,3 s: {sum(g > 0.3 for g in saltos)}, "
            f"mayor: {max(saltos, default=0):.2f} s")


def diagnostico():
    """Texto para la página /diagnostico: lo que hace falta para ver por qué un clip se congela o se desfasa."""
    v = run(["ffmpeg", "-version"], check=False).stdout.splitlines()[:1]
    out = [f"ffmpeg: {v[0] if v else '?'}", f"pistas del directo (1 = juntas, 2 = vídeo y audio aparte): {DIAG['pistas']}",
           f"listas (primer trozo, cuántos): {DIAG['listas']}",
           f"en cola: {COLA.qsize()} · estado: {AUTO.get('error') or 'ok'}", "", "Últimos mensajes de ffmpeg:"]
    out += [f"  {x[:160]}" for x in list(DIAG["ultimas"])[-8:]] or ["  (ninguno)"]
    for carpeta in (TRABAJO, CLIPS):
        archivos = sorted(glob.glob(os.path.join(carpeta, "*.mp4")) + glob.glob(os.path.join(carpeta, "*.ts")), key=os.path.getmtime)[-3:]
        for a in archivos:
            out += ["", os.path.basename(a), "  vídeo: " + huecos(a, "v"), "  audio: " + huecos(a, "a")]
    return "\n".join(out)


def leer_lista(u):
    with urllib.request.urlopen(u, timeout=20) as r:
        return trozos(r.read().decode("utf-8", "replace"), u)


def guardar_clip(d, nombre, listas, ini, fin):
    """Baja los trozos [ini, fin) de cada pista (vídeo y audio con los mismos números) a un clip en CLIPS."""
    entradas = []
    for k, info in enumerate(listas):
        lista_local(info, ini, fin, os.path.join(TRABAJO, f"{nombre}_{k}.m3u8"))
        entradas += ["-protocol_whitelist", "file,http,https,tcp,tls,crypto", "-i", f"{nombre}_{k}.m3u8"]
    try:
        run(["ffmpeg", "-y", "-v", "error", *entradas, "-map", "0:v:0", "-map", f"{len(listas) - 1}:a:0?",
             "-c", "copy", "-movflags", "+faststart", nombre + ".mp4"], cwd=TRABAJO)
    finally:
        for p in glob.glob(os.path.join(TRABAJO, nombre + "_*.m3u8")):
            os.remove(p)
    destino = os.path.join(CLIPS, nombre + ".mp4")
    os.replace(os.path.join(TRABAJO, nombre + ".mp4"), destino)
    AUTO["hechos"] += 1
    avisar_si_va_lento(destino)
    try:
        pedir_vertical({**d, "archivo": nombre + ".mp4", "borrar_original": True})
    except Exception as e:  # el clip ya está guardado: un fallo al encolarlo no debe repetir la descarga
        AUTO["error"] = "No se pudo editar un clip: " + str(e)


def bucle_auto(d):
    cada, fallos, siguiente = AUTO["cada"], 0, None  # siguiente: número del próximo trozo a grabar
    c = nueva_calidad(CALIDADES.get(d.get("calidad"), CALIDADES["buena"])[0])
    AUTO.update(alto=c["alto"], alto_max=c["max"], aviso="")
    vid = re.sub(r"\W", "", d.get("id", "directo"))[:20] or "directo"
    os.makedirs(TRABAJO, exist_ok=True); os.makedirs(CLIPS, exist_ok=True)
    while not PARAR.is_set():
        try:
            if calidad_tras_espera(c, time.time()):
                AUTO["error"] = ""  # la conexión fue bien un rato: se vuelve a probar más calidad
            AUTO.update(alto=c["alto"], aviso=aviso_calidad(c))
            urls = urls_directo(d["url"], c["alto"], nuevas=fallos > 0)
            listas = [leer_lista(u) for u in urls]
            DIAG.update(pistas=len(urls), listas=[(seq, len(segs)) for seq, segs, _ in listas])
            if any(seq is None or not segs for seq, segs, _ in listas):
                raise RuntimeError("YouTube no ha dado la lista de trozos del directo")
            ini0, fin = max(seq for seq, _, _ in listas), min(seq + len(segs) for seq, segs, _ in listas)
            if siguiente is None:
                siguiente = max(ini0, fin - 1)  # se empieza por lo más reciente
            elif siguiente < ini0:  # la conexión no dio y esos trozos ya no están en YouTube
                AUTO["error"] = f"Se perdieron {ini0 - siguiente} trozos del directo (conexión lenta)."
                siguiente = ini0
                if calidad_tras_perdida(c, time.time()):
                    AUTO["error"] += f" Baja a {c['alto']}p un rato; volverá a subir sola si la conexión mejora."
                    AUTO.update(alto=c["alto"], aviso=aviso_calidad(c))
            seq_v, segs_v, _ = listas[0]
            k, total = siguiente, 0.0
            while k < fin and total < cada - 0.5:
                total += segs_v[k - seq_v][0]
                k += 1
            fallos = 0
            if total >= cada - 0.5:  # ya hay trozos para un clip entero
                guardar_clip(d, f"{vid}_{time.strftime('%Y%m%d-%H%M%S')}", listas, siguiente, k)
                siguiente = k
                continue
        except Exception as e:
            fallos += 1
            AUTO["error"] = str(e)
            DIAG["ultimas"] = [str(e)]
            if fallos >= 3:
                AUTO["error"] = "Parado: el directo ha terminado o no responde (" + str(e) + ")"
                break
        PARAR.wait(2)
    AUTO["activo"] = False


def editor():
    while True:
        d, nombre, entrada, seg = COLA.get()
        original = os.path.basename(entrada)
        try:
            editar(d, nombre, entrada, seg, "")
            if d.get("borrar_original") and os.path.isfile(entrada):
                os.remove(entrada)  # del automático solo queda el clip editado
            if d.get("tiktok_texto") is not None:  # se pidió «Subir a TikTok» en un clip horizontal
                marcar(original, "vertical", copia=nombre + ".mp4")
                encolar_subida(nombre + ".mp4", d["tiktok_texto"])
        except Exception as e:
            AUTO["error"] = "No se pudo hacer vertical un clip: " + str(e)
            if d.get("tiktok_texto") is not None:
                marcar(original, "error", error="No se pudo hacer vertical: " + str(e))


# Subidas a TikTok: de una en una, en cuanto el clip está listo, con un máximo por día.
# El estado de cada clip se guarda en subidas.json para que siga ahí al reiniciar.
RUTA_SUBIDAS = os.path.join(AQUI, "subidas.json")
try:
    with open(RUTA_SUBIDAS, encoding="utf-8") as f:
        SUBIDAS = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    SUBIDAS = {"clips": {}, "publicadas": []}
COLA_TIKTOK, CANDADO = queue.Queue(), threading.RLock()


def marcar(archivo, estado, **datos):
    with CANDADO:
        SUBIDAS["clips"][archivo] = {"estado": estado, "hora": time.time(), **datos}
        with open(RUTA_SUBIDAS + ".tmp", "w", encoding="utf-8") as f:
            json.dump(SUBIDAS, f, ensure_ascii=False)
        os.replace(RUTA_SUBIDAS + ".tmp", RUTA_SUBIDAS)


def encolar_subida(archivo, texto):
    marcar(archivo, "en_cola", texto=texto)
    COLA_TIKTOK.put(archivo)


def duracion(p):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout.strip())


def es_vertical(p):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation",
             "-of", "json", p])
    v = (json.loads(r.stdout).get("streams") or [{}])[0]
    ancho, alto = v.get("width", 0), v.get("height", 0)
    if any(abs(int(x.get("rotation", 0))) == 90 for x in v.get("side_data_list", [])):
        ancho, alto = alto, ancho  # vídeo de móvil girado
    return alto > ancho


def huecos_hoy():
    """Cuántas subidas quedan en las últimas 24 h y cuándo se libera la siguiente."""
    with CANDADO:
        ahora = time.time()
        SUBIDAS["publicadas"] = [t for t in SUBIDAS["publicadas"] if ahora - t < 86400]
        libres = int(tiktok.CONFIG["max_dia"]) - len(SUBIDAS["publicadas"])
        return libres, (min(SUBIDAS["publicadas"]) + 86400 if SUBIDAS["publicadas"] else ahora)


def subidor():
    while True:
        archivo = COLA_TIKTOK.get()
        p = os.path.join(CLIPS, archivo)
        texto = SUBIDAS["clips"].get(archivo, {}).get("texto", "")
        try:
            libres, cuando = huecos_hoy()
            while libres <= 0:  # límite del día: espera a que haya hueco y entonces lo sube
                marcar(archivo, "en_cola", texto=texto, nota="Límite diario alcanzado: se sube a las "
                       + time.strftime("%H:%M", time.localtime(cuando)))
                time.sleep(max(30, min(600, cuando - time.time() + 5)))
                libres, cuando = huecos_hoy()
            if not os.path.isfile(p):
                raise ValueError("El clip se borró antes de subirlo.")
            marcar(archivo, "subiendo", texto=texto)
            r = tiktok.subir(p, texto, duracion(p), aviso=lambda m: marcar(archivo, "subiendo", texto=texto, nota=m))
            with CANDADO:
                SUBIDAS["publicadas"].append(time.time())
            marcar(archivo, "publicado", texto=texto, **r)
        except Exception as e:
            marcar(archivo, "error", texto=texto, error=str(e))


def pedir_tiktok(d):
    """Botón «Subir a TikTok»: si el clip ya es vertical se sube; si no, se hace vertical y luego se sube."""
    if not tiktok.conectada():
        raise ValueError("Primero conecta tu cuenta en la tarjeta «TikTok» (abajo).")
    archivo = os.path.basename(str(d.get("archivo", "")))  # basename: sin salir de clips/
    p = os.path.join(CLIPS, archivo)
    if not (p.endswith(".mp4") and os.path.isfile(p)):
        raise ValueError("Ese clip ya no existe.")
    if SUBIDAS["clips"].get(archivo, {}).get("estado") in ("en_cola", "subiendo", "haciendo_vertical", "publicado"):
        raise ValueError("Este clip ya está subido o en camino.")
    texto = tiktok.texto(str(d.get("titulo", "")).strip() or str(d.get("titulo_directo", "")).strip() or AUTO["titulo"])
    if es_vertical(p):
        encolar_subida(archivo, texto)
    else:  # TikTok es vertical: con «Original» en ajustes se usa el recorte vertical
        formato = d.get("formato") if d.get("formato") in ("vertical", "desenfocado") else "vertical"
        marcar(archivo, "haciendo_vertical", texto=texto)
        try:
            pedir_vertical(dict(d, formato=formato, tiktok_texto=texto))
        except Exception:
            SUBIDAS["clips"].pop(archivo, None)
            raise


def reanudar_subidas():
    """Al arrancar: lo que estaba en cola vuelve a la cola; lo que se cortó a medias queda como error."""
    for archivo, e in list(SUBIDAS["clips"].items()):
        if e["estado"] == "en_cola":
            COLA_TIKTOK.put(archivo)
        elif e["estado"] in ("subiendo", "haciendo_vertical"):
            marcar(archivo, "error", texto=e.get("texto", ""), error="Se cortó al cerrar el Clipper: vuelve a pulsar «Subir a TikTok».")


def vista_tiktok():
    c = tiktok.CONFIG
    libres, _ = huecos_hoy()
    return {"conectada": tiktok.conectada(), "client_key": c["client_key"], "tiene_secreto": bool(c["client_secret"]),
            "redirect_uri": c["redirect_uri"], "privacidad": c["privacidad"], "plantilla": c["plantilla"],
            "max_dia": c["max_dia"], "quedan_hoy": max(0, libres), "en_cola": COLA_TIKTOK.qsize()}


def ajustes_tiktok(d):
    c = tiktok.CONFIG
    for k in ("client_key", "redirect_uri", "plantilla"):
        if k in d:
            c[k] = str(d[k]).strip()[:2200]
    if str(d.get("client_secret", "")).strip():  # vacío = conservar el que había
        c["client_secret"] = str(d["client_secret"]).strip()
    if d.get("privacidad") in tiktok.PRIVACIDADES:
        c["privacidad"] = d["privacidad"]
    if "max_dia" in d:
        c["max_dia"] = min(max(int(d["max_dia"]), 1), 50)
    tiktok.guardar()


def pedir_vertical(d):
    """Encola la edición (vertical, efectos) de un clip ya guardado; el resultado sale como clip nuevo."""
    p = os.path.join(CLIPS, os.path.basename(str(d.get("archivo", ""))))  # basename: sin salir de clips/
    if not (p.endswith(".mp4") and os.path.isfile(p)):
        raise ValueError("Ese clip ya no existe.")
    dur = duracion(p)
    os.makedirs(TRABAJO, exist_ok=True)
    COLA.put((d, os.path.basename(p)[:-4] + "_vertical_" + str(int(time.time())), p, dur))


def estado_auto():
    return dict(AUTO, en_cola=COLA.qsize())


def lista_clips():
    clips = [p for p in glob.glob(os.path.join(CLIPS, "*.mp4"))]
    clips.sort(key=os.path.getmtime, reverse=True)
    return [{"archivo": "/clips/" + os.path.basename(p), "hora": os.path.getmtime(p),
             "mb": round(os.path.getsize(p) / 1e6, 1), "tiktok": SUBIDAS["clips"].get(os.path.basename(p))}
            for p in clips[:200]]


def inicio_video(p):
    """Segundos hasta el primer fotograma: con vídeo y audio por separado, el audio puede empezar antes."""
    t = {}
    for linea in run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,start_time", "-of", "csv=p=0", p]).stdout.split():
        tipo, _, v = linea.partition(",")
        try:
            t.setdefault(tipo, float(v))
        except ValueError:
            pass
    return round(max(0.0, t["video"] - min(t.values())), 3) if "video" in t else 0.0


def editar(d, nombre, entrada, dur, srt):
    """Pasa el tramo descargado (en TRABAJO) por formato, subtítulos y efectos, y lo deja en CLIPS."""
    ini = inicio_video(os.path.join(TRABAJO, entrada))
    dur = max(dur - ini, 1)
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
    run(["ffmpeg", "-y", "-ss", str(ini), "-i", entrada, "-filter_complex", cadena, "-map", "[v]", "-map", "0:a?",
         "-af", f"atempo={vel}", "-c:v", "libx264", "-crf", str(crf), "-preset", preset, "-c:a", "aac",
         "-movflags", "+faststart", salida], cwd=TRABAJO, baja=True)
    os.replace(salida, os.path.join(CLIPS, nombre + ".mp4"))
    for p in glob.glob(os.path.join(TRABAJO, nombre + ".*")):
        os.remove(p)
    return {"archivo": "/clips/" + nombre + ".mp4"}


def run(cmd, check=True, cwd=None, baja=False):
    # baja: prioridad baja (editar), para que la grabación del directo no se quede atrás y se salte trozos
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=cwd,
                       preexec_fn=(lambda: os.nice(15)) if baja and os.name == "posix" else None)
    if check and r.returncode:
        raise RuntimeError(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "fallo en " + cmd[0])
    return r


APP_ARCHIVOS = {
    "/manifest.json": ("manifest.json", "application/manifest+json"),
    "/sw.js": ("sw.js", "text/javascript"),
    "/app/icono-192.png": ("icono-192.png", "image/png"),
    "/app/icono-512.png": ("icono-512.png", "image/png"),
}


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
        self.send_header("WWW-Authenticate", 'Basic realm="$SANTORYU$"')
        self.send_header("Content-Length", "0")
        self.end_headers()
        return False

    def do_GET(self):
        # Archivos de la app instalable (icono, manifest, service worker): sin contraseña,
        # porque Chrome los pide sin credenciales. No contienen nada privado.
        ruta = self.path.split("?")[0]
        if ruta in APP_ARCHIVOS:
            nombre, tipo = APP_ARCHIVOS[ruta]
            with open(os.path.join(AQUI, "app", nombre), "rb") as f:
                return self.responder(200, f.read(), tipo)
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
        if self.path == "/diagnostico":
            return self.responder(200, diagnostico().encode(), "text/plain; charset=utf-8")
        if self.path == "/api/tiktok":
            return self.responder(200, json.dumps(vista_tiktok()).encode())
        if ruta == "/auth/tiktok/vuelta":  # si la Redirect URI apunta al propio Clipper, TikTok vuelve aquí
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            try:
                tiktok.usar_codigo(self.path) if q.get("code") else None
                msg = "✅ TikTok conectado. Ya puedes cerrar esta pestaña." if q.get("code") else \
                    "TikTok no dio permiso: " + (q.get("error_description") or q.get("error") or ["sin motivo"])[0]
            except Exception as e:
                msg = "No se pudo conectar TikTok: " + str(e)
            from html import escape
            return self.responder(200, f'<meta charset="utf-8"><p style="font:18px system-ui;padding:20px">{escape(msg)} '
                                       f'<a href="/">Volver al Clipper</a></p>'.encode(), "text/html; charset=utf-8")
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
            if self.path == "/api/tiktok/subir":
                pedir_tiktok(d)
                return self.responder(200, json.dumps(lista_clips()).encode())
            if self.path == "/api/tiktok/ajustes":
                ajustes_tiktok(d)
                return self.responder(200, json.dumps(vista_tiktok()).encode())
            if self.path == "/api/tiktok/permiso":
                return self.responder(200, json.dumps({"url": tiktok.url_permiso()}).encode())
            if self.path == "/api/tiktok/codigo":
                tiktok.usar_codigo(d.get("texto", ""))
                return self.responder(200, json.dumps(vista_tiktok()).encode())
            if self.path == "/api/tiktok/desconectar":
                tiktok.CONFIG.update(access_token="", refresh_token="", expira=0)
                tiktok.guardar()
                return self.responder(200, json.dumps(vista_tiktok()).encode())
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
    c = nueva_calidad(1080)
    assert not calidad_tras_perdida(c, 0) and c["alto"] == 1080          # un corte suelto: no baja
    assert not calidad_tras_perdida(c, 700) and c["alto"] == 1080        # otro 11 min después: tampoco
    assert calidad_tras_perdida(c, 800) and c["alto"] == 720             # dos en 10 min: baja
    assert not calidad_tras_espera(c, 800 + 299) and c["alto"] == 720    # aún no toca subir
    assert calidad_tras_espera(c, 800 + 300) and c["alto"] == 1080       # 5 min bien: vuelve a 1080p
    assert calidad_tras_perdida(c, 1200) and c["alto"] == 720            # falla nada más subir: baja ya...
    assert c["subir_a"] == 1200 + 600                                    # ...y la próxima prueba espera el doble
    assert calidad_tras_perdida(c, 1300) is False or c["alto"] == 480
    c = nueva_calidad(720); calidad_tras_perdida(c, 0); calidad_tras_perdida(c, 1)
    assert c["alto"] == 480 and not calidad_tras_perdida(c, 2)          # de 480p no baja más
    calidad_tras_espera(c, 1 + 300)
    assert c["alto"] == 720 and c["subir_a"] is None and not calidad_tras_espera(c, 10**6)  # no pasa de lo elegido
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
    print(f"$SANTORYU$ en http://127.0.0.1:{puerto}  (Ctrl+C para salir)")
    print("Contraseña activada (usuario: clipper)" if CLAVE else "Sin contraseña: no lo publiques con Tailscale")
    threading.Thread(target=editor, daemon=True).start()
    threading.Thread(target=subidor, daemon=True).start()
    reanudar_subidas()
    webbrowser.open(f"http://127.0.0.1:{puerto}")
    ThreadingHTTPServer(("127.0.0.1", puerto), App).serve_forever()

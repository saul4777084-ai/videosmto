"""Clipper privado: pega un link de YouTube y genera clips. Uso: python servidor.py  (o --test)"""
import base64, glob, hmac, json, os, re, subprocess, sys, time, webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

AQUI = os.path.dirname(os.path.abspath(__file__))
CLIPS = os.path.join(AQUI, "clips")
TRABAJO = os.path.join(AQUI, "trabajo")
CLAVE = os.environ.get("CLIPPER_CLAVE", "")  # vacía = sin contraseña (solo uso en el propio PC)
YTDLP = [sys.executable, "-m", "yt_dlp", "--no-playlist"]


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


def recortar_srt(cues, ini, fin):
    """Cues dentro de [ini, fin] desplazados a tiempo del clip. Quita repetidos de los subtítulos automáticos."""
    t = lambda s: "%02d:%02d:%02d,%03d" % (s // 3600, s % 3600 // 60, s % 60, round(s % 1 * 1000) % 1000)
    out, previo = [], None
    for a, z, txt in cues:
        txt = txt.splitlines()[-1] if txt else ""  # shortcut: los auto-subs repiten la línea anterior; nos quedamos con la última
        if z <= ini or a >= fin or z - a < 0.05 or not txt or txt == previo:
            continue
        previo = txt
        out.append(f"{len(out) + 1}\n{t(max(a, ini) - ini)} --> {t(min(z, fin) - ini)}\n{txt}\n")
    return "\n".join(out)


FORMATOS = {
    "vertical": "[0:v]crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=1080:1920",
    "desenfocado": "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                   "boxblur=20[f];[b]scale=1080:-2[p];[f][p]overlay=(W-w)/2:(H-h)/2",
    "original": "[0:v]null",
}


def analizar(url):
    info = json.loads(run(YTDLP + ["-J", "--", url]).stdout)
    return info


def generar(d):
    url, ini, fin = d["url"], float(d["inicio"]), float(d["fin"])
    vel = min(max(float(d.get("velocidad", 1)), 0.5), 2.0)
    if not 0 <= ini < fin or fin - ini > 600:
        raise ValueError("Tramo inválido (máx. 10 min)")
    vid = re.sub(r"\W", "", d.get("id", "video"))[:20] or "video"
    os.makedirs(TRABAJO, exist_ok=True); os.makedirs(CLIPS, exist_ok=True)
    nombre = f"{vid}_{int(ini)}_{int(time.time())}"
    tramo = os.path.join(TRABAJO, nombre + ".mp4")
    run(YTDLP + ["-f", "bv*[height<=1080]+ba/b", "--merge-output-format", "mp4", "--force-keyframes-at-cuts",
                 "--download-sections", f"*{ini}-{fin}", "-o", tramo, "--", url])
    filtro = FORMATOS.get(d.get("formato"), FORMATOS["vertical"])
    if d.get("subtitulos"):
        srts = glob.glob(os.path.join(TRABAJO, vid + ".*.srt"))
        if not srts:
            run(YTDLP + ["--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "es.*,es,en.*,en",
                         "--convert-subs", "srt", "-o", os.path.join(TRABAJO, vid), "--", url], check=False)
            srts = glob.glob(os.path.join(TRABAJO, vid + ".*.srt"))
        if srts:
            srts.sort(key=lambda p: (".es" not in p, len(p)))  # español primero, el original antes que traducciones
            with open(srts[0], encoding="utf-8") as f:
                cues = leer_srt(f.read())
            with open(os.path.join(TRABAJO, nombre + ".srt"), "w", encoding="utf-8") as f:
                f.write(recortar_srt(cues, ini, fin))
            filtro += (f",subtitles={nombre}.srt:force_style='FontName=Arial,FontSize=16,Bold=1,Outline=2,"
                       f"Alignment=2,MarginV={70 if d.get('formato') != 'original' else 20}'")
    if d.get("titulo", "").strip():
        with open(os.path.join(TRABAJO, nombre + ".txt"), "w", encoding="utf-8") as f:
            f.write(d["titulo"].strip())
        # shortcut: drawtext usa la fuente por defecto de fontconfig; en Windows sin fontconfig añade fontfile=
        filtro += f",drawtext=textfile={nombre}.txt:expansion=none:fontsize=h/24:fontcolor=white:borderw=5:x=(w-tw)/2:y=h*0.08"
    filtro += f",setpts=PTS/{vel}[v]"
    salida = os.path.join(CLIPS, nombre + ".mp4")
    # cwd=TRABAJO para pasar nombres relativos a los filtros (evita escapar rutas con ':' en Windows)
    run(["ffmpeg", "-y", "-i", nombre + ".mp4", "-filter_complex", filtro, "-map", "[v]", "-map", "0:a?",
         "-af", f"atempo={vel}", "-c:v", "libx264", "-crf", "23", "-preset", "veryfast", "-c:a", "aac",
         "-movflags", "+faststart", salida], cwd=TRABAJO)
    for p in glob.glob(os.path.join(TRABAJO, nombre + ".*")):
        os.remove(p)
    return "/clips/" + nombre + ".mp4"


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
        if self.path == "/":
            with open(os.path.join(AQUI, "index.html"), "rb") as f:
                return self.responder(200, f.read(), "text/html; charset=utf-8")
        if self.path.startswith("/clips/"):
            p = os.path.join(CLIPS, os.path.basename(self.path))  # basename: sin salir de clips/
            if os.path.isfile(p):
                with open(p, "rb") as f:
                    return self.responder(200, f.read(), "video/mp4")
        self.responder(404, b"{}")

    def do_POST(self):
        if not self.autorizado():
            return
        try:
            d = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            if not re.match(r"^https?://", str(d.get("url", ""))):
                raise ValueError("Pega un link http(s) válido")
            if self.path == "/api/analizar":
                info = analizar(d["url"])
                dur = float(info.get("duration") or 0)
                res = {"id": info["id"], "titulo": info.get("title"), "duracion": dur,
                       "picos": bool(info.get("heatmap")),
                       "clips": momentos(info.get("heatmap"), dur, int(d.get("n", 5)), float(d.get("largo", 45)))}
            elif self.path == "/api/clip":
                res = {"archivo": generar(d)}
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
    print("ok")


if __name__ == "__main__":
    if "--test" in sys.argv:
        test(); sys.exit()
    puerto = 8765
    print(f"Clipper en http://127.0.0.1:{puerto}  (Ctrl+C para salir)")
    print("Contraseña activada (usuario: clipper)" if CLAVE else "Sin contraseña: no lo publiques con Tailscale")
    webbrowser.open(f"http://127.0.0.1:{puerto}")
    ThreadingHTTPServer(("127.0.0.1", puerto), App).serve_forever()

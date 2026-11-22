#!/usr/bin/env python3
"""Publicador automático de vídeos en TikTok, YouTube Shorts y Facebook (Reels de tu página).

Vigila la carpeta videos/ y, a las horas que elijas, publica el siguiente vídeo pendiente en las
redes activadas, con la descripción que tenga en publicaciones/descripciones.md.

Uso:  PUBLICADOR_CLAVE="tu-clave" python3 publicador/servidor.py      → http://localhost:8790
Solo usa la biblioteca estándar de Python (sin pip). Ver publicador/README.md.
"""
import base64
import hmac
import json
import os
import re
import sys
import threading
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
CARPETA_VIDEOS = os.environ.get("PUBLICADOR_VIDEOS", os.path.join(RAIZ, "videos"))
DESCRIPCIONES = os.path.join(RAIZ, "publicaciones", "descripciones.md")
RUTA_CONFIG = os.path.join(AQUI, "config.json")  # claves: NO se sube a git
RUTA_ESTADO = os.path.join(AQUI, "estado.json")
PUERTO = int(os.environ.get("PUBLICADOR_PUERTO", "8790"))
CLAVE = os.environ.get("PUBLICADOR_CLAVE", "")
REDES = ("tiktok", "youtube", "facebook")
NOMBRE_RED = {"tiktok": "TikTok", "youtube": "YouTube Shorts", "facebook": "Facebook"}

CONFIG_INICIAL = {
    "horarios": ["19:30"],  # hora local del aparato donde corre
    "automatico": True,
    "simulacro": False,  # True = hace todo menos subir (para probar)
    "redes": {"tiktok": True, "youtube": True, "facebook": True},
    "youtube": {"client_id": "", "client_secret": "", "refresh_token": "", "privacidad": "public"},
    "tiktok": {"client_key": "", "client_secret": "", "redirect_uri": "", "access_token": "", "refresh_token": "", "expira": 0, "privacidad": "PUBLIC_TO_EVERYONE"},
    "facebook": {"page_id": "", "page_token": "", "pagina": "", "version": "v23.0"},
}

candado = threading.RLock()
publicando = threading.Lock()


# ------------------------------------------------------------------ guardar y leer

def leer_json(ruta, defecto):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return json.loads(json.dumps(defecto))


def guardar_json(ruta, datos):
    tmp = ruta + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
    os.replace(tmp, ruta)
    if ruta == RUTA_CONFIG:
        try:
            os.chmod(ruta, 0o600)
        except OSError:
            pass


def cargar_config():
    c = leer_json(RUTA_CONFIG, CONFIG_INICIAL)
    for k, v in CONFIG_INICIAL.items():
        if k not in c:
            c[k] = json.loads(json.dumps(v))
        elif isinstance(v, dict):
            for k2, v2 in v.items():
                c[k].setdefault(k2, v2)
    return c


config = cargar_config()
estado = leer_json(RUTA_ESTADO, {"videos": {}, "turnos": [], "registro": []})


def guardar():
    guardar_json(RUTA_CONFIG, config)
    guardar_json(RUTA_ESTADO, estado)


def log(texto):
    linea = f"{datetime.now():%d/%m %H:%M:%S}  {texto}"
    print(linea, flush=True)
    with candado:
        estado["registro"] = (estado.get("registro", []) + [linea])[-300:]
        guardar_json(RUTA_ESTADO, estado)


# ------------------------------------------------------------------ descripciones.md

def limpiar(linea):
    return linea.replace("**", "").strip()


def textos_de(nombre):
    """Busca en descripciones.md la sección del vídeo y saca el texto de TikTok y el de YouTube/Facebook."""
    base = {"tiktok": "", "titulo": "", "descripcion": ""}
    try:
        md = open(DESCRIPCIONES, encoding="utf-8").read()
    except FileNotFoundError:
        md = ""
    seccion = next((s for s in md.split("\n## ") if f"videos/{nombre}`" in s or f"videos/{nombre})" in s), "")
    bloques = {}
    for sub in seccion.split("\n### ")[1:]:
        cabecera, _, cuerpo = sub.partition("\n")
        lineas = [l[1:].strip() if l.startswith(">") else None for l in cuerpo.splitlines()]
        cita = "\n".join(limpiar(l) for l in lineas if l is not None).strip()
        if "tiktok" in cabecera.lower():
            bloques["corto"] = cita
        elif "youtube" in cabecera.lower() or "facebook" in cabecera.lower():
            bloques["largo"] = cita
    corto = bloques.get("corto") or bloques.get("largo") or ""
    largo = bloques.get("largo") or corto
    base["tiktok"] = corto
    if largo:
        primera, _, resto = largo.partition("\n")
        base["titulo"] = primera.strip()
        base["descripcion"] = resto.strip()
    if not base["titulo"]:
        base["titulo"] = re.sub(r"[-_]+", " ", os.path.splitext(nombre)[0]).strip().capitalize()
    if not base["tiktok"]:
        base["tiktok"] = base["titulo"]
    return base


def titulo_youtube(t):
    t = t.strip()[:100]
    return t if "#short" in t.lower() or len(t) > 91 else f"{t} #Shorts"


# ------------------------------------------------------------------ vídeos y cola

def buscar_videos():
    """Añade los vídeos nuevos de la carpeta. En el primer arranque, los que ya había quedan 'antiguo'
    (no se publican solos: se ponen en cola a mano desde la página)."""
    try:
        archivos = [a for a in os.listdir(CARPETA_VIDEOS) if a.lower().endswith(".mp4")]
    except FileNotFoundError:
        return
    archivos.sort(key=lambda a: os.path.getmtime(os.path.join(CARPETA_VIDEOS, a)))
    with candado:
        primer_arranque = not estado.get("iniciado")
        cambios = False
        for a in archivos:
            if a not in estado["videos"]:
                estado["videos"][a] = {
                    "estado": "antiguo" if primer_arranque else "pendiente",
                    "orden": max([v.get("orden", 0) for v in estado["videos"].values()] + [0]) + 1,
                    "textos": textos_de(a),
                    "redes": {},
                    "visto": datetime.now().isoformat(timespec="seconds"),
                }
                cambios = True
                if not primer_arranque:
                    log(f"Nuevo vídeo en cola: {a}")
        if primer_arranque:
            estado["iniciado"] = True
            cambios = True
        if cambios:
            guardar_json(RUTA_ESTADO, estado)


def siguiente_pendiente():
    with candado:
        pend = [(v["orden"], n) for n, v in estado["videos"].items() if v["estado"] == "pendiente" and os.path.exists(os.path.join(CARPETA_VIDEOS, n))]
    return min(pend)[1] if pend else None


def proximo_turno():
    ahora = datetime.now()
    horas = sorted(h for h in config["horarios"] if re.fullmatch(r"\d{1,2}:\d{2}", h))
    for h in horas:
        hh, mm = map(int, h.split(":"))
        t = ahora.replace(hour=hh, minute=mm, second=0, microsecond=0)
        if t > ahora:
            return t.strftime("hoy %H:%M")
    return f"mañana {horas[0]}" if horas else "sin horario"


# ------------------------------------------------------------------ HTTP

class ErrorRed(Exception):
    pass


def ocultar(texto):
    return re.sub(r"(access_token|client_secret|refresh_token|fb_exchange_token)=[^&\s\"']+", r"\1=***", str(texto))


def peticion(metodo, url, datos=None, cabeceras=None, json_=None, form=None, timeout=900):
    cab = dict(cabeceras or {})
    if json_ is not None:
        datos = json.dumps(json_).encode()
        cab.setdefault("Content-Type", "application/json; charset=UTF-8")
    if form is not None:
        datos = urllib.parse.urlencode(form).encode()
        cab.setdefault("Content-Type", "application/x-www-form-urlencoded")
    req = urllib.request.Request(url, data=datos, method=metodo, headers=cab)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            cuerpo = r.read()
            cab_resp = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        raise ErrorRed(f"{metodo} {ocultar(url.split('?')[0])} → {e.code}: {ocultar(e.read()[:600].decode('utf-8', 'replace'))}")
    except urllib.error.URLError as e:
        raise ErrorRed(f"{metodo} {ocultar(url.split('?')[0])} → sin conexión: {e.reason}")
    try:
        res = json.loads(cuerpo) if cuerpo else {}
    except json.JSONDecodeError:
        res = {"texto": cuerpo[:300].decode("utf-8", "replace")}
    return cab_resp, res


# ------------------------------------------------------------------ YouTube

YT_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
YT_TOKEN = "https://oauth2.googleapis.com/token"


def yt_url_permiso(redirect):
    c = config["youtube"]
    q = {"client_id": c["client_id"], "redirect_uri": redirect, "response_type": "code", "scope": "https://www.googleapis.com/auth/youtube.upload", "access_type": "offline", "prompt": "consent", "state": "youtube"}
    return f"{YT_AUTH}?{urllib.parse.urlencode(q)}"


def yt_codigo(codigo, redirect):
    c = config["youtube"]
    _, r = peticion("POST", YT_TOKEN, form={"code": codigo, "client_id": c["client_id"], "client_secret": c["client_secret"], "redirect_uri": redirect, "grant_type": "authorization_code"})
    if not r.get("refresh_token"):
        raise ErrorRed("Google no devolvió refresh_token: quita el acceso de la app en tu cuenta de Google y vuelve a conectar")
    c["refresh_token"] = r["refresh_token"]


def subir_youtube(ruta, textos):
    c = config["youtube"]
    _, tok = peticion("POST", YT_TOKEN, form={"client_id": c["client_id"], "client_secret": c["client_secret"], "refresh_token": c["refresh_token"], "grant_type": "refresh_token"})
    auth = {"Authorization": f"Bearer {tok['access_token']}"}
    meta = {
        "snippet": {"title": titulo_youtube(textos["titulo"]), "description": textos["descripcion"], "categoryId": "24"},
        "status": {"privacyStatus": c.get("privacidad", "public"), "selfDeclaredMadeForKids": False},
    }
    tam = os.path.getsize(ruta)
    cab, _ = peticion(
        "POST",
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        json_=meta,
        cabeceras={**auth, "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(tam)},
    )
    with open(ruta, "rb") as f:
        _, r = peticion("PUT", cab["location"], datos=f.read(), cabeceras={**auth, "Content-Type": "video/mp4"})
    return {"id": r.get("id"), "url": f"https://youtube.com/shorts/{r.get('id')}"}


# ------------------------------------------------------------------ TikTok

TT_API = "https://open.tiktokapis.com/v2"


def tt_url_permiso():
    c = config["tiktok"]
    q = {"client_key": c["client_key"], "response_type": "code", "scope": "user.info.basic,video.publish", "redirect_uri": c["redirect_uri"], "state": "tiktok"}
    return f"https://www.tiktok.com/v2/auth/authorize/?{urllib.parse.urlencode(q)}"


def tt_guardar_token(r):
    if "access_token" not in r:
        raise ErrorRed(f"TikTok no dio token: {r}")
    c = config["tiktok"]
    c["access_token"] = r["access_token"]
    c["refresh_token"] = r.get("refresh_token", c["refresh_token"])
    c["expira"] = int(time.time()) + int(r.get("expires_in", 86400))


def tt_codigo(codigo):
    c = config["tiktok"]
    _, r = peticion("POST", f"{TT_API}/oauth/token/", form={"client_key": c["client_key"], "client_secret": c["client_secret"], "code": codigo, "grant_type": "authorization_code", "redirect_uri": c["redirect_uri"]})
    tt_guardar_token(r)


def tt_token():
    c = config["tiktok"]
    if c["expira"] - 300 < time.time():
        _, r = peticion("POST", f"{TT_API}/oauth/token/", form={"client_key": c["client_key"], "client_secret": c["client_secret"], "grant_type": "refresh_token", "refresh_token": c["refresh_token"]})
        tt_guardar_token(r)
        guardar_json(RUTA_CONFIG, config)
    return c["access_token"]


def tt_ok(r, paso):
    err = r.get("error", {})
    if err.get("code") not in (None, "ok"):
        raise ErrorRed(f"TikTok ({paso}): {err.get('code')} — {err.get('message')}")
    return r.get("data", {})


def subir_tiktok(ruta, textos):
    auth = {"Authorization": f"Bearer {tt_token()}"}
    _, r = peticion("POST", f"{TT_API}/post/publish/creator_info/query/", json_={}, cabeceras=auth)
    opciones = tt_ok(r, "cuenta").get("privacy_level_options", [])
    priv = config["tiktok"]["privacidad"]
    if priv not in opciones:
        nueva = "SELF_ONLY" if "SELF_ONLY" in opciones else (opciones[0] if opciones else "SELF_ONLY")
        log(f"TikTok no permite {priv} todavía (app sin auditar): se sube como {nueva}")
        priv = nueva
    tam = os.path.getsize(ruta)
    trozo = tam if tam <= 64 * 1024 * 1024 else 10 * 1024 * 1024
    total = max(1, tam // trozo)
    _, r = peticion(
        "POST",
        f"{TT_API}/post/publish/video/init/",
        cabeceras=auth,
        json_={
            "post_info": {"title": textos["tiktok"][:2200], "privacy_level": priv, "disable_duet": False, "disable_comment": False, "disable_stitch": False, "video_cover_timestamp_ms": 1000},
            "source_info": {"source": "FILE_UPLOAD", "video_size": tam, "chunk_size": trozo, "total_chunk_count": total},
        },
    )
    d = tt_ok(r, "inicio")
    with open(ruta, "rb") as f:
        for i in range(total):
            ini = i * trozo
            fin = tam - 1 if i == total - 1 else ini + trozo - 1
            f.seek(ini)
            parte = f.read(fin - ini + 1)
            peticion("PUT", d["upload_url"], datos=parte, cabeceras={"Content-Type": "video/mp4", "Content-Length": str(len(parte)), "Content-Range": f"bytes {ini}-{fin}/{tam}"})
    for _ in range(60):  # hasta 5 minutos esperando a que TikTok lo procese
        time.sleep(5)
        _, r = peticion("POST", f"{TT_API}/post/publish/status/fetch/", cabeceras=auth, json_={"publish_id": d["publish_id"]})
        s = tt_ok(r, "estado")
        if s.get("status") == "PUBLISH_COMPLETE":
            ids = s.get("publicaly_available_post_id") or []
            return {"id": d["publish_id"], "privacidad": priv, "url": f"https://www.tiktok.com/video/{ids[0]}" if ids else ""}
        if s.get("status") == "FAILED":
            raise ErrorRed(f"TikTok rechazó el vídeo: {s.get('fail_reason')}")
    return {"id": d["publish_id"], "privacidad": priv, "nota": "TikTok aún lo está procesando"}


# ------------------------------------------------------------------ Facebook (Reels de la página)

def fb_base():
    return f"https://graph.facebook.com/{config['facebook']['version']}"


def fb_conectar(app_id, app_secret, token_usuario, page_id=""):
    """Cambia el token corto del Explorador por uno largo y saca el token (sin caducidad) de la página."""
    _, r = peticion("GET", f"{fb_base()}/oauth/access_token?" + urllib.parse.urlencode({"grant_type": "fb_exchange_token", "client_id": app_id, "client_secret": app_secret, "fb_exchange_token": token_usuario}))
    largo = r["access_token"]
    _, r = peticion("GET", f"{fb_base()}/me/accounts?" + urllib.parse.urlencode({"access_token": largo, "fields": "id,name,access_token"}))
    paginas = r.get("data", [])
    if not paginas:
        raise ErrorRed("Ese usuario no administra ninguna página de Facebook (o faltan permisos pages_show_list)")
    p = next((x for x in paginas if x["id"] == page_id), paginas[0])
    config["facebook"].update({"page_id": p["id"], "page_token": p["access_token"], "pagina": p["name"]})
    return [x["name"] for x in paginas]


def subir_facebook(ruta, textos):
    c = config["facebook"]
    tam = os.path.getsize(ruta)
    _, r = peticion("POST", f"{fb_base()}/{c['page_id']}/video_reels", form={"upload_phase": "start", "access_token": c["page_token"]})
    vid = r["video_id"]
    with open(ruta, "rb") as f:
        peticion("POST", f"https://rupload.facebook.com/video-upload/{c['version']}/{vid}", datos=f.read(), cabeceras={"Authorization": f"OAuth {c['page_token']}", "offset": "0", "file_size": str(tam), "Content-Type": "application/octet-stream"})
    texto = "\n\n".join(t for t in (textos["titulo"], textos["descripcion"]) if t)
    _, r = peticion("POST", f"{fb_base()}/{c['page_id']}/video_reels", form={"upload_phase": "finish", "video_id": vid, "video_state": "PUBLISHED", "description": texto, "access_token": c["page_token"]})
    if not r.get("success", True):
        raise ErrorRed(f"Facebook no confirmó la publicación: {r}")
    return {"id": vid, "url": f"https://www.facebook.com/reel/{vid}"}


# ------------------------------------------------------------------ publicar

SUBIR = {"tiktok": subir_tiktok, "youtube": subir_youtube, "facebook": subir_facebook}


def conectada(red):
    c = config[red]
    return bool(c["page_token"] if red == "facebook" else c["refresh_token"])


def publicar(nombre):
    """Publica un vídeo en todas las redes activadas donde aún no esté. Devuelve True si todo fue bien."""
    if not publicando.acquire(blocking=False):
        log("Ya hay una publicación en marcha; espero al siguiente turno")
        return False
    try:
        ruta = os.path.join(CARPETA_VIDEOS, nombre)
        with candado:
            v = estado["videos"][nombre]
            if not any(v["textos"].values()):
                v["textos"] = textos_de(nombre)
            textos = dict(v["textos"])
        todo_ok = True
        for red in REDES:
            if not config["redes"].get(red) or v["redes"].get(red, {}).get("ok"):
                continue
            if not conectada(red) and not config["simulacro"]:
                log(f"{NOMBRE_RED[red]}: sin conectar, me la salto")
                todo_ok = False
                continue
            log(f"Subiendo {nombre} a {NOMBRE_RED[red]}…")
            try:
                res = {"simulacro": True} if config["simulacro"] else SUBIR[red](ruta, textos)
                with candado:
                    v["redes"][red] = {"ok": True, "fecha": datetime.now().isoformat(timespec="seconds"), **res}
                log(f"✓ {NOMBRE_RED[red]}: {res.get('url') or res.get('nota') or 'publicado'}{' (simulacro)' if config['simulacro'] else ''}")
            except Exception as e:  # noqa: BLE001 — cualquier fallo de una red no debe parar las demás
                todo_ok = False
                detalle = str(e) if isinstance(e, ErrorRed) else f"{type(e).__name__}: {e}"
                with candado:
                    v["redes"][red] = {"ok": False, "fecha": datetime.now().isoformat(timespec="seconds"), "error": ocultar(detalle)}
                log(f"✗ {NOMBRE_RED[red]}: {ocultar(detalle)}")
                if not isinstance(e, ErrorRed):
                    traceback.print_exc()
        with candado:
            v["estado"] = "publicado" if todo_ok else "error"
            guardar()
        return todo_ok
    finally:
        publicando.release()


def bucle():
    while True:
        try:
            buscar_videos()
            ahora = datetime.now()
            turno = ahora.strftime("%Y-%m-%d ") + ahora.strftime("%H:%M")
            if config["automatico"] and ahora.strftime("%H:%M") in [h.zfill(5) for h in config["horarios"]] and turno not in estado["turnos"]:
                with candado:
                    estado["turnos"] = (estado["turnos"] + [turno])[-50:]
                    guardar_json(RUTA_ESTADO, estado)
                nombre = siguiente_pendiente()
                if nombre:
                    log(f"Turno de las {ahora:%H:%M}: toca {nombre}")
                    threading.Thread(target=publicar, args=(nombre,), daemon=True).start()
                else:
                    log(f"Turno de las {ahora:%H:%M}: no hay vídeos pendientes")
        except Exception:  # noqa: BLE001
            traceback.print_exc()
        time.sleep(20)


# ------------------------------------------------------------------ servidor web

def vista_estado():
    with candado:
        videos = [
            {"nombre": n, **{k: v[k] for k in ("estado", "orden", "textos", "redes")}, "existe": os.path.exists(os.path.join(CARPETA_VIDEOS, n))}
            for n, v in sorted(estado["videos"].items(), key=lambda kv: (kv[1]["estado"] != "pendiente", kv[1]["orden"]))
        ]
        return {
            "ajustes": {k: config[k] for k in ("horarios", "automatico", "simulacro", "redes")},
            "conexiones": {
                "youtube": {"conectada": conectada("youtube"), "client_id": config["youtube"]["client_id"], "tiene_secreto": bool(config["youtube"]["client_secret"]), "privacidad": config["youtube"]["privacidad"]},
                "tiktok": {"conectada": conectada("tiktok"), "client_key": config["tiktok"]["client_key"], "tiene_secreto": bool(config["tiktok"]["client_secret"]), "redirect_uri": config["tiktok"]["redirect_uri"], "privacidad": config["tiktok"]["privacidad"]},
                "facebook": {"conectada": conectada("facebook"), "pagina": config["facebook"]["pagina"], "version": config["facebook"]["version"]},
            },
            "videos": videos,
            "proximo": proximo_turno(),
            "siguiente": siguiente_pendiente(),
            "publicando": publicando.locked(),
            "registro": estado.get("registro", [])[-80:],
        }


class App(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def autorizado(self):
        if not CLAVE:
            return True
        esperado = "Basic " + base64.b64encode(b"publicador:" + CLAVE.encode()).decode()
        if hmac.compare_digest(self.headers.get("Authorization", ""), esperado):
            return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Publicador"')
        self.end_headers()
        return False

    def responder(self, datos, codigo=200, tipo="application/json; charset=utf-8"):
        cuerpo = datos if isinstance(datos, bytes) else json.dumps(datos, ensure_ascii=False).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cuerpo)

    def redirigir(self, url):
        self.send_response(302)
        self.send_header("Location", url)
        self.end_headers()

    def base(self):
        return f"http://{self.headers.get('Host', f'localhost:{PUERTO}')}"

    def do_GET(self):
        if not self.autorizado():
            return
        u = urllib.parse.urlparse(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        try:
            if u.path == "/":
                self.responder(open(os.path.join(AQUI, "index.html"), "rb").read(), tipo="text/html; charset=utf-8")
            elif u.path == "/api/estado":
                self.responder(vista_estado())
            elif u.path == "/auth/youtube":
                self.redirigir(yt_url_permiso(self.base() + "/auth/youtube/vuelta"))
            elif u.path == "/auth/tiktok":
                self.redirigir(tt_url_permiso())
            elif u.path in ("/auth/youtube/vuelta", "/auth/tiktok/vuelta"):
                red = u.path.split("/")[2]
                if "code" not in q:
                    raise ErrorRed(q.get("error_description") or q.get("error") or "no llegó el código")
                if red == "youtube":
                    yt_codigo(q["code"], self.base() + "/auth/youtube/vuelta")
                else:
                    tt_codigo(q["code"])
                guardar()
                log(f"{NOMBRE_RED[red]} conectado")
                self.redirigir("/")
            else:
                self.responder({"error": "no existe"}, 404)
        except Exception as e:  # noqa: BLE001
            self.responder(f"<meta charset=utf-8><p>Error: {ocultar(e)}</p><p><a href='/'>Volver</a></p>".encode(), 400, "text/html; charset=utf-8")

    def do_POST(self):
        if not self.autorizado():
            return
        try:
            datos = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0) or 0)) or b"{}")
            ruta = urllib.parse.urlparse(self.path).path
            res = self.accion(ruta, datos)
            self.responder({"ok": True, **(res or {})})
        except Exception as e:  # noqa: BLE001
            self.responder({"ok": False, "error": ocultar(e)}, 400)

    def accion(self, ruta, d):
        if ruta == "/api/ajustes":
            horarios = [h.strip() for h in d.get("horarios", config["horarios"]) if re.fullmatch(r"\d{1,2}:\d{2}", h.strip())]
            with candado:
                config["horarios"] = [h.zfill(5) for h in horarios]
                for k in ("automatico", "simulacro"):
                    if k in d:
                        config[k] = bool(d[k])
                for red in REDES:
                    if red in d.get("redes", {}):
                        config["redes"][red] = bool(d["redes"][red])
                guardar()
            return None
        if ruta == "/api/credenciales":
            red = d["red"]
            permitidos = {"youtube": ("client_id", "client_secret", "privacidad"), "tiktok": ("client_key", "client_secret", "redirect_uri", "privacidad"), "facebook": ("version",)}[red]
            with candado:
                for k in permitidos:
                    if d.get(k):
                        config[red][k] = d[k].strip()
                guardar()
            return None
        if ruta == "/api/codigo":  # por si el navegador no puede volver solo al servidor: pegar la URL final
            red = d["red"]
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(d["url"].strip()).query))
            if "code" not in q:
                raise ErrorRed("En esa dirección no hay ningún ?code=")
            if red == "youtube":
                yt_codigo(q["code"], d.get("redirect") or f"http://localhost:{PUERTO}/auth/youtube/vuelta")
            else:
                tt_codigo(q["code"])
            guardar()
            log(f"{NOMBRE_RED[red]} conectado")
            return None
        if ruta == "/api/facebook":
            paginas = fb_conectar(d["app_id"].strip(), d["app_secret"].strip(), d["token"].strip(), d.get("page_id", "").strip())
            guardar()
            log(f"Facebook conectado a la página «{config['facebook']['pagina']}»")
            return {"paginas": paginas}
        if ruta == "/api/desconectar":
            red = d["red"]
            with candado:
                for k in ("refresh_token", "access_token", "page_token"):
                    if k in config[red]:
                        config[red][k] = ""
                guardar()
            log(f"{NOMBRE_RED[red]} desconectado")
            return None
        if ruta == "/api/video":
            n, acc = d["nombre"], d["accion"]
            with candado:
                v = estado["videos"][n]
                if acc == "cola":
                    v["estado"] = "pendiente"
                elif acc == "quitar":
                    v["estado"] = "omitido"
                elif acc in ("subir", "bajar"):
                    cola = sorted((x for x in estado["videos"].values() if x["estado"] == "pendiente"), key=lambda x: x["orden"])
                    i = cola.index(v) if v in cola else -1
                    j = i - 1 if acc == "subir" else i + 1
                    if i >= 0 and 0 <= j < len(cola):
                        v["orden"], cola[j]["orden"] = cola[j]["orden"], v["orden"]
                elif acc == "textos":
                    v["textos"] = {k: str(d["textos"].get(k, "")) for k in ("tiktok", "titulo", "descripcion")}
                elif acc == "recargar":
                    v["textos"] = textos_de(n)
                guardar_json(RUTA_ESTADO, estado)
            if acc == "publicar":
                threading.Thread(target=publicar, args=(n,), daemon=True).start()
            return None
        raise ErrorRed("acción desconocida")


def main():
    if not os.path.isdir(CARPETA_VIDEOS):
        print(f"No encuentro la carpeta de vídeos: {CARPETA_VIDEOS}")
        sys.exit(1)
    buscar_videos()
    guardar()
    threading.Thread(target=bucle, daemon=True).start()
    host = os.environ.get("PUBLICADOR_HOST", "127.0.0.1")
    print(f"Publicador en http://localhost:{PUERTO}  (vídeos: {CARPETA_VIDEOS})")
    print("Contraseña activada (usuario: publicador)" if CLAVE else "Sin contraseña: úsalo solo en este aparato")
    print(f"Próximo turno: {proximo_turno()} · modo {'automático' if config['automatico'] else 'manual'}{' · SIMULACRO' if config['simulacro'] else ''}")
    ThreadingHTTPServer((host, PUERTO), App).serve_forever()


if __name__ == "__main__":
    main()

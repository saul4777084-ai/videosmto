"""Subir clips a TikTok (Content Posting API, Direct Post). Solo biblioteca estándar de Python.

Las claves y el token se guardan en clipper/tiktok.json (está en .gitignore: no se sube a GitHub).
"""
import json, os, time, urllib.error, urllib.parse, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RUTA = os.path.join(AQUI, "tiktok.json")
API = "https://open.tiktokapis.com/v2"
INICIAL = {"client_key": "", "client_secret": "", "redirect_uri": "", "access_token": "", "refresh_token": "",
           "expira": 0, "privacidad": "PUBLIC_TO_EVERYONE", "plantilla": "{titulo} 🔥 #clips #directo #fyp", "max_dia": 15}
PRIVACIDADES = ("PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY")


class ErrorTikTok(Exception):
    pass


def cargar():
    try:
        with open(RUTA, encoding="utf-8") as f:
            c = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        c = {}
    return {**INICIAL, **c}


CONFIG = cargar()


def guardar():
    tmp = RUTA + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(CONFIG, f, ensure_ascii=False, indent=1)
    os.replace(tmp, RUTA)
    try:
        os.chmod(RUTA, 0o600)
    except OSError:
        pass


def conectada():
    return bool(CONFIG["refresh_token"] or CONFIG["access_token"])


def texto(titulo):
    """Descripción del vídeo: la plantilla con {titulo} cambiado por el título del clip o del directo."""
    t = CONFIG["plantilla"].replace("{titulo}", str(titulo or "").strip())
    return " ".join(t.split())[:2200]


def peticion(metodo, url, datos=None, cab=None, json_=None, form=None, timeout=900):
    cab = dict(cab or {})
    if json_ is not None:
        datos, cab["Content-Type"] = json.dumps(json_).encode(), "application/json; charset=UTF-8"
    if form is not None:
        datos, cab["Content-Type"] = urllib.parse.urlencode(form).encode(), "application/x-www-form-urlencoded"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=datos, method=metodo, headers=cab), timeout=timeout) as r:
            cuerpo = r.read()
    except urllib.error.HTTPError as e:
        cuerpo = e.read()
        try:  # TikTok explica el error en el JSON (code y message)
            return json.loads(cuerpo)
        except json.JSONDecodeError:
            raise ErrorTikTok(f"TikTok respondió {e.code}: {cuerpo[:300].decode('utf-8', 'replace')}")
    except urllib.error.URLError as e:
        raise ErrorTikTok(f"Sin conexión con TikTok: {e.reason}")
    try:
        return json.loads(cuerpo) if cuerpo else {}
    except json.JSONDecodeError:
        return {}


def ok(r, paso):
    err = r.get("error") or {}
    if err.get("code") not in (None, "ok"):
        raise ErrorTikTok(f"TikTok ({paso}): {err.get('code')} — {err.get('message')}")
    return r.get("data") or {}


def url_permiso():
    if not (CONFIG["client_key"] and CONFIG["redirect_uri"]):
        raise ErrorTikTok("Primero guarda el Client key y la Redirect URI.")
    q = {"client_key": CONFIG["client_key"], "response_type": "code", "scope": "user.info.basic,video.publish",
         "redirect_uri": CONFIG["redirect_uri"], "state": "clipper"}
    return "https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode(q)


def guardar_token(r):
    if "access_token" not in r:
        raise ErrorTikTok(f"TikTok no dio el token: {r.get('error_description') or r.get('error') or r}")
    CONFIG["access_token"] = r["access_token"]
    CONFIG["refresh_token"] = r.get("refresh_token") or CONFIG["refresh_token"]
    CONFIG["expira"] = int(time.time()) + int(r.get("expires_in", 86400))
    guardar()


def usar_codigo(pegado):
    """Acepta la dirección completa a la que vuelve TikTok (…?code=…) o solo el código."""
    pegado = str(pegado).strip()
    codigo = urllib.parse.parse_qs(urllib.parse.urlparse(pegado).query).get("code", [""])[0] if "code=" in pegado else pegado
    if not codigo:
        raise ErrorTikTok("No encuentro el código: pega la dirección completa que sale tras aceptar en TikTok.")
    guardar_token(peticion("POST", f"{API}/oauth/token/", form={
        "client_key": CONFIG["client_key"], "client_secret": CONFIG["client_secret"], "code": codigo,
        "grant_type": "authorization_code", "redirect_uri": CONFIG["redirect_uri"]}))


def token():
    if not conectada():
        raise ErrorTikTok("TikTok no está conectado: conéctalo en la tarjeta «TikTok».")
    if CONFIG["expira"] - 300 < time.time():
        guardar_token(peticion("POST", f"{API}/oauth/token/", form={
            "client_key": CONFIG["client_key"], "client_secret": CONFIG["client_secret"],
            "grant_type": "refresh_token", "refresh_token": CONFIG["refresh_token"]}))
    return CONFIG["access_token"]


def subir(ruta, descripcion, duracion, aviso=print):
    """Publica el vídeo en la cuenta conectada. Devuelve {privacidad, url} (url vacía si TikTok aún no la da)."""
    auth = {"Authorization": f"Bearer {token()}"}
    cuenta = ok(peticion("POST", f"{API}/post/publish/creator_info/query/", json_={}, cab=auth), "cuenta")
    maximo = cuenta.get("max_video_post_duration_sec")
    if maximo and duracion > maximo:
        raise ErrorTikTok(f"El clip dura {duracion:.0f} s y tu cuenta deja subir como mucho {maximo} s.")
    opciones = cuenta.get("privacy_level_options") or ["SELF_ONLY"]
    priv = CONFIG["privacidad"]
    if priv not in opciones:  # app sin auditar: TikTok solo deja «Solo yo»
        priv = "SELF_ONLY" if "SELF_ONLY" in opciones else opciones[0]
        aviso(f"TikTok aún no deja publicar en público (app sin auditar): se sube como {priv}")
    tam = os.path.getsize(ruta)
    trozo = tam if tam <= 64 * 1024 * 1024 else 10 * 1024 * 1024
    total = max(1, tam // trozo)  # el último trozo se lleva el resto, como pide TikTok
    d = ok(peticion("POST", f"{API}/post/publish/video/init/", cab=auth, json_={
        "post_info": {"title": descripcion, "privacy_level": priv, "disable_duet": False, "disable_comment": False,
                      "disable_stitch": False, "video_cover_timestamp_ms": 1000},
        "source_info": {"source": "FILE_UPLOAD", "video_size": tam, "chunk_size": trozo, "total_chunk_count": total}}), "inicio")
    with open(ruta, "rb") as f:
        for i in range(total):
            ini = i * trozo
            fin = tam - 1 if i == total - 1 else ini + trozo - 1
            f.seek(ini)
            parte = f.read(fin - ini + 1)
            req = urllib.request.Request(d["upload_url"], data=parte, method="PUT", headers={
                "Content-Type": "video/mp4", "Content-Length": str(len(parte)), "Content-Range": f"bytes {ini}-{fin}/{tam}"})
            try:
                urllib.request.urlopen(req, timeout=900).read()
            except urllib.error.HTTPError as e:
                raise ErrorTikTok(f"TikTok cortó la subida ({e.code}).")
            except urllib.error.URLError as e:
                raise ErrorTikTok(f"Se cortó la conexión subiendo el vídeo: {e.reason}")
    for _ in range(60):  # hasta 5 minutos esperando a que TikTok lo procese
        time.sleep(5)
        s = ok(peticion("POST", f"{API}/post/publish/status/fetch/", cab=auth, json_={"publish_id": d["publish_id"]}), "estado")
        if s.get("status") == "PUBLISH_COMPLETE":
            ids = s.get("publicaly_available_post_id") or []  # así lo escribe TikTok
            return {"privacidad": priv, "url": f"https://www.tiktok.com/video/{ids[0]}" if ids else ""}
        if s.get("status") == "FAILED":
            raise ErrorTikTok(f"TikTok rechazó el vídeo: {s.get('fail_reason')}")
    return {"privacidad": priv, "url": "", "nota": "TikTok aún lo está procesando; saldrá en tu perfil en unos minutos"}

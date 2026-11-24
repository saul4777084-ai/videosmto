"""
"¿Qué le pasa a tu cerebro si usas el móvil 8 horas al día durante 30 días?" — guion y tiempos.

Mismo sistema que el vídeo de la Coca-Cola (tools/tiempos_cola.py):
  1. duración de cada frase: la real de la locución (src/videos/movil/voz.json, de tools/voz_movil.py)
     o, si aún no hay voz, una estimación por sílabas;
  2. escribe src/videos/movil/tiempos.json (escenas, frases y subtítulos palabra a palabra);
  3. escribe los textos para grabar la voz y los subtítulos:
       guiones/movil-8-horas.md               guion con el segundo en que empieza cada frase
       guiones/movil-8-horas-elevenlabs.txt   texto con pausas <break> para ElevenLabs
       out/movil-8-horas.srt                  subtítulos en español

Uso:  python3 tools/tiempos_movil.py
"""
import json
import os
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(RAIZ, 'tools'))
from tiempos_cola import hms, medir, mmss, trocear  # noqa: E402

SLUG = 'movil-8-horas'
DIR = os.path.join(RAIZ, 'src', 'videos', 'movil')

# (id, título de la escena, inicio mínimo, [(texto en pantalla, texto para la voz, pausa después)])
ESCENAS = [
    ('intro', 'INTRODUCCIÓN', 0.0, [
        ('¿Qué le pasa a tu cerebro si usas el móvil 8 horas al día durante 30 días?',
         '¿Qué le pasa a tu cerebro si usas el móvil ocho horas al día durante treinta días?', 0.5),
        ('Vamos a verlo por dentro.', 'Vamos a verlo por dentro.', 0.0),
    ]),
    ('dia1', 'DÍA 1', 9.0, [
        ('Día uno. Suena una notificación, y tu cerebro reacciona antes de que lo pienses.',
         'Día uno. Suena una notificación, y tu cerebro reacciona antes de que lo pienses.', 0.45),
        ('Cada mensaje, cada «me gusta» y cada vídeo nuevo es una pequeña recompensa que no sabes cuándo llegará.',
         'Cada mensaje, cada me gusta y cada vídeo nuevo es una pequeña recompensa que no sabes cuándo llegará.', 0.4),
        ('El sistema de recompensa responde con dopamina, la molécula que te empuja a buscar más.',
         'El sistema de recompensa responde con dopamina, la molécula que te empuja a buscar más.', 0.0),
    ]),
    ('dia7', 'DÍA 7', 0.0, [
        ('Día siete. Tu cerebro aprende el patrón: aviso, mirar, recompensa.',
         'Día siete. Tu cerebro aprende el patrón: aviso, mirar, recompensa.', 0.4),
        ('Cuanto más se repite, más fuerte se vuelve el circuito, y coges el móvil casi sin pensarlo.',
         'Cuanto más se repite, más fuerte se vuelve el circuito, y coges el móvil casi sin pensarlo.', 0.0),
    ]),
    ('dia15', 'DÍA 15', 0.0, [
        ('Día quince. Saltar de una cosa a otra cada pocos segundos tiene un precio.',
         'Día quince. Saltar de una cosa a otra cada pocos segundos tiene un precio.', 0.4),
        ('Después de cada interrupción, a la parte frontal del cerebro le cuesta volver a concentrarse.',
         'Después de cada interrupción, a la parte frontal del cerebro le cuesta volver a concentrarse.', 0.4),
        ('Y frente a la pantalla parpadeas menos: los ojos se secan y se cansan.',
         'Y frente a la pantalla parpadeas menos: los ojos se secan y se cansan.', 0.0),
    ]),
    ('dia30', 'DÍA 30', 0.0, [
        ('Día treinta. 8 horas al día son 240 horas: diez días enteros mirando una pantalla.',
         'Día treinta. Ocho horas al día son doscientas cuarenta horas: diez días enteros mirando una pantalla.', 0.4),
        ('De noche, la luz y el contenido que engancha pueden retrasar la melatonina, la hormona del sueño.',
         'De noche, la luz y el contenido que engancha pueden retrasar la melatonina, la hormona del sueño.', 0.4),
        ('Y dormir peor se asocia con menos atención, peor memoria y más ansiedad.',
         'Y dormir peor se asocia con menos atención, peor memoria y más ansiedad.', 0.0),
    ]),
    ('final', 'FINAL', 0.0, [
        ('El móvil no es el enemigo: el problema es no darle nunca un descanso a tu cerebro.',
         'El móvil no es el enemigo: el problema es no darle nunca un descanso a tu cerebro.', 0.4),
        ('Silencia las notificaciones y deja la pantalla una hora antes de dormir.',
         'Silencia las notificaciones y deja la pantalla una hora antes de dormir.', 0.5),
        ('La buena noticia: tu cerebro se adapta, y también puede recuperarse.',
         'La buena noticia: tu cerebro se adapta, y también puede recuperarse.', 0.0),
    ]),
]
RETARDO_INICIO = 0.6   # imagen antes de la primera palabra de cada escena
COLA_ESCENA = 0.9      # imagen después de la última palabra de cada escena
COLA_FINAL = 2.6       # final del vídeo sin voz


def voz_grabada():
    ruta = os.path.join(DIR, 'voz.json')
    if not os.path.exists(ruta):
        return None
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)['frases']


def main():
    escenas, frases_json, subs = [], [], []
    t = 0.0
    k = 0
    grabada = voz_grabada()
    if grabada:
        print('usando la duración real de la locución (src/videos/movil/voz.json)')
    for eid, titulo, inicio_min, frases in ESCENAS:
        inicio = max(inicio_min, t)
        cursor = inicio + RETARDO_INICIO
        for texto, voz, pausa in frases:
            g = grabada[k] if grabada else None
            if g and g['texto'] != texto:
                raise SystemExit(f'voz.json no corresponde al guion: "{g["texto"]}" ≠ "{texto}". Vuelve a ejecutar tools/voz_movil.py')
            dur = g['dur'] if g else medir(voz, k)
            k += 1
            palabras_txt = texto.split()
            if g:
                tp = [cursor + v for v in g['palabras']]
            else:
                tot = len(texto)
                tp, acum = [], 0
                for w in palabras_txt:
                    tp.append(cursor + dur * acum / tot)
                    acum += len(w) + 1
            frases_json.append({'escena': eid, 'texto': texto, 'voz': voz, 'inicio': round(cursor, 3), 'fin': round(cursor + dur, 3), 'pausa': pausa,
                                'palabras': [round(v, 3) for v in tp]})
            j = 0
            for l in trocear(texto):
                n = len(l.split())
                ini = tp[j]
                fin = tp[j + n] if j + n < len(tp) else cursor + dur
                subs.append({'texto': l, 'inicio': round(ini, 3), 'fin': round(fin, 3), 'palabras': [round(v, 3) for v in tp[j:j + n]]})
                j += n
            cursor += dur + pausa
        t = cursor + COLA_ESCENA
        escenas.append({'id': eid, 'titulo': titulo, 'inicio': round(inicio, 3)})
    total = t + COLA_FINAL - COLA_ESCENA
    for i, e in enumerate(escenas):
        e['fin'] = escenas[i + 1]['inicio'] if i + 1 < len(escenas) else round(total, 3)

    os.makedirs(DIR, exist_ok=True)
    with open(os.path.join(DIR, 'tiempos.json'), 'w', encoding='utf-8') as f:
        json.dump({'duracion': round(total, 3), 'escenas': escenas, 'frases': frases_json, 'subtitulos': subs}, f, ensure_ascii=False, indent=1)

    os.makedirs(os.path.join(RAIZ, 'out'), exist_ok=True)
    with open(os.path.join(RAIZ, 'out', f'{SLUG}.srt'), 'w', encoding='utf-8') as f:
        for i, s in enumerate(subs, 1):
            f.write(f"{i}\n{hms(s['inicio'])} --> {hms(s['fin'])}\n{s['texto']}\n\n")

    lineas = []
    for e in escenas:
        fr = [x for x in frases_json if x['escena'] == e['id']]
        partes = []
        for x in fr:
            partes.append(x['voz'])
            if x is not fr[-1] and x['pausa'] >= 0.3:
                partes.append(f'<break time="{x["pausa"]:.1f}s" />')
        lineas.append(' '.join(partes))
    with open(os.path.join(RAIZ, 'guiones', f'{SLUG}-elevenlabs.txt'), 'w', encoding='utf-8') as f:
        f.write('\n<break time="1.5s" />\n'.join(lineas) + '\n')

    md = ['# ¿Qué le pasa a tu cerebro si usas el móvil 8 horas al día durante 30 días?', '',
          f'Narración (voz masculina grave, natural y expresiva). Duración del vídeo: {total:.1f} s.', '',
          'El minuto:segundo indica cuándo empieza cada frase en el vídeo.', '',
          '> Los días son una estructura narrativa, no plazos médicos. Los efectos dependen del uso, del descanso',
          '> y de cada persona; varias de estas relaciones son asociaciones, no causas demostradas.', '']
    for e in escenas:
        md += [f"## {e['titulo']}  ·  {mmss(e['inicio'])} – {mmss(e['fin'])}", '']
        for x in frases_json:
            if x['escena'] == e['id']:
                md.append(f"- **{mmss(x['inicio'])}** — {x['voz']}")
        md.append('')
    md += ['## Texto completo (para copiar y pegar)', '']
    md += [' '.join(x['voz'] for x in frases_json if x['escena'] == e['id']) + '\n' for e in escenas]
    with open(os.path.join(RAIZ, 'guiones', f'{SLUG}.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))

    for e in escenas:
        print(f"{e['id']:6s} {e['inicio']:6.2f} → {e['fin']:6.2f}")
    print('duración total', round(total, 2), 's')


if __name__ == '__main__':
    main()

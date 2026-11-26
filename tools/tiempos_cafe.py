"""
"¿Qué le pasa a tu cuerpo si tomas 5 cafés al día durante 30 días?" — guion y tiempos.

Mismo sistema que el vídeo de la Coca-Cola (tools/tiempos_cola.py):
  1. duración de cada frase: la real de la locución (src/videos/cafe/voz.json, de tools/voz_cafe.py)
     o, si aún no hay voz, una estimación por sílabas;
  2. escribe src/videos/cafe/tiempos.json (escenas, frases y subtítulos palabra a palabra);
  3. escribe los textos para grabar la voz y los subtítulos:
       guiones/cafe-30-dias.md               guion con el segundo en que empieza cada frase
       guiones/cafe-30-dias-elevenlabs.txt   texto con pausas <break> para ElevenLabs
       out/cafe-30-dias.srt                  subtítulos en español

Uso:  python3 tools/tiempos_cafe.py
"""
import json
import os
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(RAIZ, 'tools'))
from tiempos_cola import hms, medir, mmss, trocear  # noqa: E402

SLUG = 'cafe-30-dias'
DIR = os.path.join(RAIZ, 'src', 'videos', 'cafe')

# (id, título de la escena, inicio mínimo, [(texto en pantalla, texto para la voz, pausa después)])
ESCENAS = [
    ('intro', 'INTRODUCCIÓN', 0.0, [
        ('¿Qué le pasa a tu cuerpo si tomas 5 cafés al día durante 30 días?',
         '¿Qué le pasa a tu cuerpo si tomas cinco cafés al día durante treinta días?', 0.5),
        ('Vamos a verlo por dentro.', 'Vamos a verlo por dentro.', 0.0),
    ]),
    ('dia1', 'DÍA 1', 9.0, [
        ('Día uno. La cafeína pasa del estómago a la sangre, y en unos 45 minutos llega a tu cerebro.',
         'Día uno. La cafeína pasa del estómago a la sangre, y en unos cuarenta y cinco minutos llega a tu cerebro.', 0.4),
        ('Allí ocupa el sitio de la adenosina, la molécula que te hace sentir cansancio.',
         'Allí ocupa el sitio de la adenosina, la molécula que te hace sentir cansancio.', 0.4),
        ('Por eso te despejas. Y sube la adrenalina: el corazón puede acelerarse un poco.',
         'Por eso te despejas. Y sube la adrenalina: el corazón puede acelerarse un poco.', 0.0),
    ]),
    ('dia7', 'DÍA 7', 0.0, [
        ('Día siete. Cinco cafés pueden sumar unos 450 miligramos de cafeína al día.',
         'Día siete. Cinco cafés pueden sumar unos cuatrocientos cincuenta miligramos de cafeína al día.', 0.35),
        ('Es más de los 400 que se consideran seguros para un adulto sano.',
         'Es más de los cuatrocientos que se consideran seguros para un adulto sano.', 0.4),
        ('Y tu cerebro se adapta: puede fabricar más receptores de adenosina, y el mismo café ya no te despierta igual.',
         'Y tu cerebro se adapta: puede fabricar más receptores de adenosina, y el mismo café ya no te despierta igual.', 0.0),
    ]),
    ('dia15', 'DÍA 15', 0.0, [
        ('Día quince. Tu cuerpo tarda unas cinco horas en eliminar la mitad de la cafeína.',
         'Día quince. Tu cuerpo tarda unas cinco horas en eliminar la mitad de la cafeína.', 0.4),
        ('El café de las cinco de la tarde sigue en tu sangre a las diez de la noche.',
         'El café de las cinco de la tarde sigue en tu sangre a las diez de la noche.', 0.4),
        ('Duermes peor, te levantas cansado, y necesitas otro café.',
         'Duermes peor, te levantas cansado, y necesitas otro café.', 0.0),
    ]),
    ('dia30', 'DÍA 30', 0.0, [
        ('Día treinta. Si un día no lo tomas, puede aparecer dolor de cabeza, cansancio e irritabilidad.',
         'Día treinta. Si un día no lo tomas, puede aparecer dolor de cabeza, cansancio e irritabilidad.', 0.35),
        ('Es la abstinencia de cafeína, y puede durar varios días.',
         'Es la abstinencia de cafeína, y puede durar varios días.', 0.4),
        ('Y en dosis altas, algunas personas notan nervios, palpitaciones o acidez.',
         'Y en dosis altas, algunas personas notan nervios, palpitaciones o acidez.', 0.0),
    ]),
    ('final', 'FINAL', 0.0, [
        ('El café no es el enemigo: hasta 3 o 4 tazas al día se asocian incluso con beneficios.',
         'El café no es el enemigo: hasta tres o cuatro tazas al día se asocian incluso con beneficios.', 0.4),
        ('La clave está en la dosis y en la hora: el último, al menos seis horas antes de dormir.',
         'La clave está en la dosis y en la hora: el último, al menos seis horas antes de dormir.', 0.5),
        ('La mejor energía de cada día sigue siendo dormir bien.',
         'La mejor energía de cada día sigue siendo dormir bien.', 0.0),
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
        print('usando la duración real de la locución (src/videos/cafe/voz.json)')
    for eid, titulo, inicio_min, frases in ESCENAS:
        inicio = max(inicio_min, t)
        cursor = inicio + RETARDO_INICIO
        for texto, voz, pausa in frases:
            g = grabada[k] if grabada else None
            if g and g['texto'] != texto:
                raise SystemExit(f'voz.json no corresponde al guion: "{g["texto"]}" ≠ "{texto}". Vuelve a ejecutar tools/voz_cafe.py')
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

    md = ['# ¿Qué le pasa a tu cuerpo si tomas 5 cafés al día durante 30 días?', '',
          f'Narración (voz masculina grave, natural y expresiva). Duración del vídeo: {total:.1f} s.', '',
          'El minuto:segundo indica cuándo empieza cada frase en el vídeo.', '',
          '> Los días son una estructura narrativa, no plazos médicos. La cafeína de una taza varía mucho (unos',
          '> 60–120 mg) y la sensibilidad depende de cada persona. Embarazo: máximo recomendado 200 mg al día.', '']
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

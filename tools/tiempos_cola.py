"""
"¿Qué le pasa a tu cuerpo si tomas Coca-Cola durante 30 días?" — guion y tiempos.

El vídeo se entrega SIN audio (la voz la graba el autor). Este script:
  1. estima cuánto dura cada frase a ritmo de locución (sílabas por segundo + pausas en la puntuación);
  2. escribe src/videos/cola/tiempos.json (escenas, frases y subtítulos en segundos);
  3. escribe los textos para grabar la voz y los subtítulos:
       guiones/coca-cola-30-dias.md               guion con el segundo en que empieza cada frase
       guiones/coca-cola-30-dias-elevenlabs.txt   texto con pausas <break> para ElevenLabs
       out/coca-cola-30-dias.srt                  subtítulos en español

Uso:  python3 tools/tiempos_cola.py
"""
import json
import os

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# (id, título de la escena, inicio mínimo, [(texto en pantalla, texto para la voz, pausa después)])
ESCENAS = [
    ('intro', 'INTRODUCCIÓN', 0.0, [
        ('¿Qué le pasa a tu cuerpo si tomas Coca-Cola todos los días durante 30 días?',
         '¿Qué le pasa a tu cuerpo si tomas Coca-Cola todos los días durante treinta días?', 0.5),
        ('Vamos a verlo por dentro.', 'Vamos a verlo por dentro.', 0.0),
    ]),
    ('dia1', 'DÍA 1', 9.0, [
        ('Día uno. El refresco baja por el esófago y llega al estómago.',
         'Día uno. El refresco baja por el esófago y llega al estómago.', 0.45),
        ('Una lata clásica de 330 ml tiene unos 35 gramos de azúcar: casi siete cucharaditas.',
         'Una lata clásica de trescientos treinta mililitros tiene unos treinta y cinco gramos de azúcar: casi siete cucharaditas.', 0.35),
        ('Ese azúcar se absorbe rápido y pasa a la sangre.', 'Ese azúcar se absorbe rápido y pasa a la sangre.', 0.0),
    ]),
    ('dia7', 'DÍA 7', 0.0, [
        ('Día siete. Después de cada bebida, la glucosa en sangre sube.',
         'Día siete. Después de cada bebida, la glucosa en sangre sube.', 0.4),
        ('El páncreas responde con insulina, la hormona que ayuda a que la glucosa entre en las células.',
         'El páncreas responde con insulina, la hormona que ayuda a que la glucosa entre en las células.', 0.4),
        ('Y así, un día tras otro.', 'Y así, un día tras otro.', 0.0),
    ]),
    ('dia15', 'DÍA 15', 0.0, [
        ('Día quince. El hígado procesa gran parte de la fructosa.', 'Día quince. El hígado procesa gran parte de la fructosa.', 0.4),
        ('Cuando el exceso de azúcar y calorías se mantiene en el tiempo, parte se convierte en grasa que puede acumularse en el hígado.',
         'Cuando el exceso de azúcar y calorías se mantiene en el tiempo, parte se convierte en grasa que puede acumularse en el hígado.', 0.0),
    ]),
    ('dia30', 'DÍA 30', 0.0, [
        ('Día treinta. Mantenido durante meses o años, este hábito se asocia con aumento de peso,',
         'Día treinta. Mantenido durante meses o años, este hábito se asocia con aumento de peso,', 0.15),
        ('mayor riesgo de diabetes tipo 2, hígado graso y problemas cardiovasculares.',
         'mayor riesgo de diabetes tipo dos, hígado graso y problemas cardiovasculares.', 0.4),
        ('Y su cafeína puede afectar al sueño.', 'Y su cafeína puede afectar al sueño.', 0.0),
    ]),
    ('final', 'FINAL', 0.0, [
        ('Los días son solo una forma de contarlo: cada cuerpo es distinto.',
         'Los días son solo una forma de contarlo: cada cuerpo es distinto.', 0.4),
        ('Un refresco ocasional no te daña de golpe, pero el hábito diario suma.',
         'Un refresco ocasional no te daña de golpe, pero el hábito diario suma.', 0.5),
        ('Tu mejor bebida de cada día sigue siendo el agua.', 'Tu mejor bebida de cada día sigue siendo el agua.', 0.0),
    ]),
]
RETARDO_INICIO = 0.6   # imagen antes de la primera palabra de cada escena
COLA_ESCENA = 0.9      # imagen después de la última palabra de cada escena
COLA_FINAL = 2.5       # final del vídeo sin voz
SILABAS_SEG = 5.6     # ritmo de la locución (voz grave, natural; 5-6 sílabas/s)


VOCALES = set('aeiouáéíóúü')


def silabas(palabra):
    """Número aproximado de sílabas (grupos de vocales; los hiatos con tilde cuentan doble)."""
    p = palabra.lower()
    n, prev = 0, False
    for ch in p:
        v = ch in VOCALES
        if v and (not prev or ch in 'áéíóú' and p.find(ch) > 0 and p[p.find(ch) - 1] in 'aeo'):
            n += 1
        prev = v
    return max(1, n)


def medir(texto, i=0):
    """Duración estimada de la frase a ritmo de locución grave y pausada:
    SILABAS_SEG sílabas por segundo + pequeñas pausas en comas y dos puntos."""
    sil = sum(silabas(w) for w in texto.split())
    pausas = texto.count(',') * 0.22 + texto.count(':') * 0.32
    return sil / SILABAS_SEG + pausas + 0.15


DEBILES = {'de', 'del', 'la', 'el', 'los', 'las', 'a', 'y', 'e', 'que', 'en', 'con', 'por', 'para', 'su', 'sus', 'un', 'una', 'tu', 'se', 'no', 'lo', 'al', 'como', 'pero', 'más', 'cada', 'si', 'o', 'gran', 'unos', 'tipo', 'te'}


def trocear(texto, n_max=6):
    """Líneas de subtítulo cortas (estilo TikTok): primero se corta en la puntuación; las
    cláusulas largas se parten por la mitad sin dejar "de", "la"… al final de una línea, y las
    cláusulas de una o dos palabras se juntan con la vecina."""
    clausulas, act = [], []
    for w in texto.split():
        act.append(w)
        if w.endswith((',', ':', '.', '?', ';')):
            clausulas.append(act)
            act = []
    if act:
        clausulas.append(act)
    lineas = []
    for c in clausulas:
        while len(c) > n_max + 1:
            k = (len(c) + 1) // 2 if len(c) <= 2 * n_max else n_max
            while k > 2 and c[k - 1].lower().strip(',:.?') in DEBILES:
                k -= 1
            lineas.append(c[:k])
            c = c[k:]
        lineas.append(c)
    res = []
    for l in lineas:
        if res and (len(l) <= 2 or len(res[-1]) <= 2) and len(res[-1]) + len(l) <= n_max + 2 and not res[-1][-1].endswith(('.', '?')):
            res[-1] = res[-1] + l
        else:
            res.append(l)
    return [' '.join(l) for l in res]


def hms(s):
    ms = int(round(s * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def mmss(s):
    return f'{int(s // 60)}:{s % 60:04.1f}'


def main():
    escenas, frases_json, subs = [], [], []
    t = 0.0
    k = 0
    for eid, titulo, inicio_min, frases in ESCENAS:
        inicio = max(inicio_min, t)
        cursor = inicio + RETARDO_INICIO
        for texto, voz, pausa in frases:
            dur = medir(voz, k)
            k += 1
            frases_json.append({'escena': eid, 'texto': texto, 'voz': voz, 'inicio': round(cursor, 3), 'fin': round(cursor + dur, 3), 'pausa': pausa})
            lineas = trocear(texto)
            letras = sum(len(l) for l in lineas)
            c = cursor
            for l in lineas:
                d = dur * len(l) / letras
                subs.append({'texto': l, 'inicio': round(c, 3), 'fin': round(c + d, 3)})
                c += d
            cursor += dur + pausa
        t = cursor + COLA_ESCENA
        escenas.append({'id': eid, 'titulo': titulo, 'inicio': round(inicio, 3)})
    total = t + COLA_FINAL - COLA_ESCENA
    for i, e in enumerate(escenas):
        e['fin'] = escenas[i + 1]['inicio'] if i + 1 < len(escenas) else round(total, 3)

    datos = {'duracion': round(total, 3), 'escenas': escenas, 'frases': frases_json, 'subtitulos': subs}
    with open(os.path.join(RAIZ, 'src', 'videos', 'cola', 'tiempos.json'), 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)

    # subtítulos .srt
    os.makedirs(os.path.join(RAIZ, 'out'), exist_ok=True)
    with open(os.path.join(RAIZ, 'out', 'coca-cola-30-dias.srt'), 'w', encoding='utf-8') as f:
        for i, s in enumerate(subs, 1):
            f.write(f"{i}\n{hms(s['inicio'])} --> {hms(s['fin'])}\n{s['texto']}\n\n")

    # texto para ElevenLabs (pausas entre frases y entre escenas)
    lineas = []
    for e in escenas:
        fr = [x for x in frases_json if x['escena'] == e['id']]
        partes = []
        for x in fr:
            partes.append(x['voz'])
            if x is not fr[-1] and x['pausa'] >= 0.3:
                partes.append(f'<break time="{x["pausa"]:.1f}s" />')
        lineas.append(' '.join(partes))
    with open(os.path.join(RAIZ, 'guiones', 'coca-cola-30-dias-elevenlabs.txt'), 'w', encoding='utf-8') as f:
        f.write('\n<break time="1.5s" />\n'.join(lineas) + '\n')

    # guion legible con tiempos
    md = ['# ¿Qué le pasa a tu cuerpo si tomas Coca-Cola durante 30 días?', '',
          f'Narración para grabar (voz masculina grave, natural y expresiva). Duración del vídeo: {total:.1f} s.', '',
          'El minuto:segundo indica cuándo empieza cada frase en el vídeo. Si tu locución va algo más rápida o lenta no pasa nada:',
          'empieza cada escena en su segundo y deja respirar las pausas.', '',
          '> Los días son una estructura narrativa, no plazos médicos. Los efectos dependen de la cantidad, de la',
          '> alimentación completa y de cada persona.', '']
    for e in escenas:
        md += [f"## {e['titulo']}  ·  {mmss(e['inicio'])} – {mmss(e['fin'])}", '']
        for x in frases_json:
            if x['escena'] == e['id']:
                md.append(f"- **{mmss(x['inicio'])}** — {x['voz']}")
        md.append('')
    md += ['## Texto completo (para copiar y pegar)', '']
    md += [' '.join(x['voz'] for x in frases_json if x['escena'] == e['id']) + '\n' for e in escenas]
    with open(os.path.join(RAIZ, 'guiones', 'coca-cola-30-dias.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))

    for e in escenas:
        print(f"{e['id']:6s} {e['inicio']:6.2f} → {e['fin']:6.2f}")
    print('duración total', round(total, 2), 's')


if __name__ == '__main__':
    main()

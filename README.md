# videosmto — Animación "¿Quema calorías la cama?"

Vídeo explicativo animado en 2D, vertical 9:16 (1080×1920, 30 fps), hecho con **React + Remotion + SVG**.
Todos los personajes, fondos e iconos están dibujados con código (SVG): no hay ninguna imagen fija.

Vídeo renderizado: `out/calorias-cama.mp4`

## Uso

```bash
npm install
npm run studio   # previsualizar y editar en el navegador
npm run render   # exporta out/calorias-cama.mp4
```

## Qué editar

| Quieres cambiar…              | Archivo                         |
|-------------------------------|---------------------------------|
| Narración / música / duración | `src/config/video.ts` (audio en `public/`) |
| Tiempos de cada escena        | `src/config/escenas.ts`         |
| Subtítulos y rótulos          | `src/config/textos.ts` (`*palabra*` = resaltado) |
| Valores de los contadores     | `src/config/contadores.ts`      |
| Colores de los personajes     | `src/characters/palette.ts`     |
| Efectos de sonido y música    | `src/config/sonidos.ts` (archivos en `public/sfx/`) |
| Avatar y sus gestos           | `src/config/avatar.ts` (poses en `public/poses/`) |
| Cámara, efectos y transiciones | `src/config/camara.ts` (o panel **Props** del Studio) |

## Estructura

- `src/scenes/` — las 7 escenas (cada una es también una composición independiente en el Studio, carpeta "Escenas").
- `src/sets/` — escenarios: habitación, gimnasio, fondo científico, mesa, salón con tele.
- `src/characters/` — cabeza con expresiones, corredor articulado, cinta de correr.
- `src/components/` — contador digital de 7 segmentos, llamas, corazones, relojes, cronómetro, subtítulos, transiciones (`Clip`).

## Cámara cinematográfica

Cada plano (toma) se compone de **capas con profundidad** (`0` fondo lejano · `1` personaje · `>1` primer término)
y una lista de efectos en `src/config/camara.ts`. El motor (`src/camera/`) calcula la cámara como función pura del
frame, así que lo que ves en el Studio es exactamente lo que sale en el MP4.

| Efecto        | Qué hace | Intensidad = |
|---------------|----------|--------------|
| `zoomIn`      | Acercamiento progresivo hacia `focoX/focoY` | +% de zoom (0.2 = +20 %) |
| `zoomOut`     | Alejamiento; si no hay zoom previo, el plano arranca cerca | % de zoom |
| `rackFocus`   | Pasa el enfoque de la profundidad `planoDesde` a `planoHasta` | ×10 px de desenfoque por unidad de profundidad |
| `profundidad` | Depth of field: enfoca `planoHasta`, desenfoca el resto | ×10 px por unidad |
| `motionBlur`  | Refuerza el obturador (y barrido si `dirX/dirY` ≠ 0) | +200 % obturador, ×260 px |
| `paneo`       | Movimiento horizontal/vertical (`dirX`, `dirY`) | ×300 px |
| `parallax`    | Desplaza cada capa según su profundidad | ×100 px |
| `dollyZoom`   | El personaje se acerca poco y el fondo cambia mucho de escala | aumento |
| `focusPull`   | Desenfoca la escena y enfoca progresivamente `planoHasta` (y los rótulos) | ×18 px |
| `temblor`     | Camera shake con ataque rápido y caída (`velocidad` = frecuencia) | ×28 px |

Parámetros comunes: `inicio`, `duracion` (segundos dentro del plano), `velocidad` (2 = llega al destino en la mitad
del tiempo), `curva` (`suave`, `entrada`, `salida`, `lineal`, `rebote`, `latigo`), `mantener` (quedarse o volver),
`centrar` (llevar el foco al centro), `sonido` + `volumen` (SFX sincronizado con el inicio del efecto).

**Sincronía con la voz:** `en('plano', palabra('276 calorías'))` devuelve el segundo del plano en el que esa palabra
aparece en los subtítulos; `en('plano', 10.4)` convierte un segundo absoluto (p. ej. el de un SFX de `sonidos.ts`).

**Ajustes globales** (`CAMARA.global`): intensidad general, cámara en mano (`respiracion`), zoom máximo,
desenfoque máximo del personaje principal (para que siempre sea reconocible), cuánto siguen los rótulos a la cámara
y el **motion blur real**: en modo `muestras` cada capa se expone varias veces dentro del obturador
(`obturador` 0.5 = 180°) y se promedian; se activa solo cuando el movimiento supera `umbral` px por frame.
El modo `direccional` usa un filtro SVG, más rápido de renderizar.

**Transiciones** (`CAMARA.transiciones`, cómo entra cada plano): `fundido`, `zoom`, `barrido` (empuje lateral con
desenfoque de movimiento), `desenfoque`, `corte`.

**Controles en el Studio:** `npm run studio` → composición `CaloriasCama` (o cada escena en la carpeta *Escenas*) →
panel **Props**. Ahí se puede activar/desactivar cada efecto y cambiar su intensidad, duración, velocidad, curva y
posición del foco con vista previa inmediata. Para renderizar con unos ajustes propios sin tocar el código:
`npx remotion render CaloriasCama out/video.mp4 --props=mis-ajustes.json`.

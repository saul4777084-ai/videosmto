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
| Avatar y sus gestos           | `src/config/avatar.ts` (poses en `public/poses/`) |

## Estructura

- `src/scenes/` — las 7 escenas (cada una es también una composición independiente en el Studio, carpeta "Escenas").
- `src/sets/` — escenarios: habitación, gimnasio, fondo científico, mesa, salón con tele.
- `src/characters/` — cabeza con expresiones, corredor articulado, cinta de correr.
- `src/components/` — contador digital de 7 segmentos, llamas, corazones, relojes, cronómetro, subtítulos, transiciones (`Clip`).

# Dirección visual descartada: "Panel de parches"

**Fecha:** 2026-07-30
**Estado:** NO DESARROLLADA — conservada a propósito
**Rama:** `diseno/panel-de-parches` (no fusionar en `main`)

## Por qué existe este documento

De las tres direcciones visuales propuestas para el rediseño del catálogo
(ver `.artifacts/todo/2026-07-30-reorganizacion-y-rediseno.md`, Fase 3), se
eligió **"Panel de vuelo"** para Club Halcones. Esta —"Panel de parches"— se
guarda sin desarrollar por si en el futuro interesa dar otro enfoque al
proyecto, o por si sirve de punto de partida para un proyecto distinto.

No hay código de aplicación en esta rama. Solo la dirección: tokens,
tipografía, elemento firma y el especimen HTML autocontenido
(`panel-de-parches-especimen.html`) para volver a verla renderizada sin
reconstruirla.

## Concepto

Un tablero de velcro con los artículos cosidos encima. Las tarjetas no son
contenedores de información: son **objetos físicos**. Pespunte interior,
relieve, y se despegan ligeramente del tablero al pasar por encima.

Trata el merchandising como **colección**, no como inventario. Es la dirección
más cálida de las tres y la que menos se parece a un panel de administración.

Encaja especialmente bien si el catálogo llega a mostrar fotografía real y
grande de parches bordados: el lenguaje de la interfaz y el del producto son el
mismo, y se refuerzan. Es también la que más pierde con imágenes pobres o
inconsistentes, porque el marco promete materialidad.

## Tokens de color

| Token       | Hex       | Papel                                        |
|-------------|-----------|----------------------------------------------|
| `board`     | `#3B4035` | Fondo: oliva de tejido de bucle (velcro)     |
| `board-2`   | `#343930` | Oliva más oscuro para relieves y surcos      |
| `patch`     | `#EFEDE5` | Tarjeta: hueso del parche                    |
| `patch-2`   | `#E3E0D5` | Variante para etiquetas y agotados           |
| `ink`       | `#22251E` | Texto principal sobre tarjeta                |
| `muted`     | `#6B6F62` | Texto secundario (AA justo sobre `patch`)    |
| `bullion`   | `#A8831F` | Hilo bordado dorado: acento y stock bajo     |
| `squadron`  | `#9E2B25` | Rojo de insignia: solo agotado               |

Decisiones deliberadas:
- El fondo oliva viene del material real (tejido de bucle), no de una paleta
  genérica. Evita a propósito el cluster crema `#F4F1EA` + serif + terracota.
- El hueso `#EFEDE5` aparece **como tarjeta, nunca como fondo de página**. Es lo
  que lo separa del look crema por defecto.
- Oro y rojo son materiales (hilo, insignia), no decoración. El rojo se reserva
  exclusivamente al agotado.

## Tipografía

Pensada para fuentes de sistema (el especimen no descarga nada). Si se
desarrollara con `next/font`, ver alternativas abajo.

| Rol      | Stack de sistema                                            |
|----------|-------------------------------------------------------------|
| Display  | `Copperplate, "Copperplate Gothic Bold", Georgia, "Palatino Linotype", serif` |
| Texto    | `Candara, "Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif` |
| Datos    | `Consolas, "SF Mono", Menlo, monospace`                     |

El display en caja alta con tracking abierto busca el grabado de insignia.
Copperplate solo existe en macOS; en Windows cae a Georgia, que aguanta el
registro heráldico sin romper la dirección.

Con webfonts reales, mejores candidatas para el display: **Copperplate Gothic**,
**Trajan**, o una slab robusta tipo **Zilla Slab** / **Arvo** en caja alta.
Para texto, **Karla** o **Public Sans** mantienen el aire humanista de Candara.

## Elemento firma

**La tarjeta como objeto cosido.**

- Borde interior de puntos (`border: 1.5px dashed`) inset 5px, simulando pespunte.
- Doble sombra: proyectada hacia fuera (despegue del tablero) + `inset` clara
  arriba (relieve del canto).
- En hover: `translateY(-4px)` con una rotación mínima de `-0.35deg`. La
  rotación es la clave — evita que el movimiento se lea como un hover de tarjeta
  web al uso y lo convierte en un objeto que se levanta del velcro.
- Los filtros de categoría son **etiquetas de nombre cosidas** (name tapes), no
  píldoras: fondo hueso, pespunte, sombra baja.

Todo el movimiento respeta `prefers-reduced-motion: reduce`.

## Tratamiento del agotado

Sello sobreimpreso en diagonal (`rotate(-7deg)`) con doble filete, en rojo de
escuadrón al 82% de opacidad, sobresaliendo 6px por ambos lados de la tarjeta.

Lo importante: **la tarjeta no se apaga**. Sigue siendo legible y operable. Es
la corrección deliberada al bug actual de producción, donde
`components/ProductCard.tsx:23` aplica `pointer-events-none` al `<article>`
completo y deja muertos los controles de admin de los productos agotados.

## Qué haría falta para desarrollarla

1. Trasladar los tokens a `tailwind.config.js` (o a variables CSS si se acaba
   migrando a Tailwind 4).
2. Resolver la textura del tablero. En el especimen son dos
  `repeating-linear-gradient` cruzados a 45°; a tamaño real probablemente
   convenga una textura de bucle en SVG o un PNG pequeño en `background-repeat`.
3. Decidir la forma de la tarjeta. El especimen usa rectángulo con esquina de
   3px. Los parches reales son circulares o de escudo: merece la pena probar
   `clip-path` en escudo para la categoría "parches" y dejar rectángulo para el
   resto. No explorado.
4. Revisar el contraste de `muted` sobre `patch` (≈4.6:1). Pasa AA para texto
   normal pero sin margen. Si el cuerpo de texto baja de 13px, oscurecerlo.
5. El sello de agotado sobresale de la tarjeta: verificar que ningún contenedor
   padre lo recorte con `overflow: hidden`.

## Referencia visual

`panel-de-parches-especimen.html` en esta misma carpeta. Autocontenido, se abre
directamente en el navegador. Las imágenes de producto son marcas de posición en
SVG, no las fotos reales del bucket de Supabase.

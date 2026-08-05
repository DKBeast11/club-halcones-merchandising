# Reorganización y rediseño de Club Halcones

**Última sesión:** 2026-08-05
**Punto de partida:** `2c289fa` (21-oct-2025) — 2.084 líneas, 21 archivos
**Estado:** fases 0, 1 y 3 hechas, más las categorías. La preview de Vercel
construye y está en verde. Sigue **sin fusionar a `main`**.

---

## 1. Cómo está todo ahora mismo

### Ramas

| Rama | Estado | Qué es |
|---|---|---|
| `main` | `2c289fa`, intacta | Lo que hay en producción. No se ha tocado. |
| `rediseno/panel-de-vuelo` | `a9a0355`, **subida** | Todo el trabajo. 8 commits. Preview en verde. |
| `diseno/panel-de-parches` | `8f5095c`, **solo local** | Dirección visual descartada, sin desarrollar. ⚠ Se pierde si formateas: `git push -u origin diseno/panel-de-parches` |

Los commits de `rediseno/panel-de-vuelo` están ordenados para que **cada uno
compile por separado** (toolchain → auth → interfaz). Si algún día haces bisect,
no hay puntos rotos.

### Infraestructura

- **Supabase**: proyecto `club-halcones-merchandising`, West EU (Paris), plan
  gratuito, `t4g.nano`. Activo. 24 productos, 27 imágenes.
- **Bucket `Products`**: pasado a **público** el 30-07-2026. Contiene CAMISETAS,
  LLAVEROS, MISCELANEA, PARCHES.
- **Bucket `product-images`**: público y vacío. Lo creaba sola la API. Ya no se
  usa; se puede borrar.
- **Tabla `categories`**: creada el 05-08-2026. Cuatro filas. `products.category`
  es ahora clave ajena contra ella, no un `CHECK`.
- **Vercel**: producción desplegada desde `main` (último deploy: 21-oct-2025).
  La preview de la rama **construye correctamente** desde el 05-08-2026.

---

## 2. ✅ El bloqueante, resuelto el 05-08-2026

**El diagnóstico de la sesión anterior era incorrecto y se deja escrito aquí
porque costó tiempo.** No eran las variables de entorno. La preview moría a los
**3 segundos**, que es demasiado pronto para ser un fallo de compilación: ni
siquiera llegaba a `next build`. El log decía `Command "npm install" exited
with 1`, con un ERESOLVE.

La causa: **`lucide-react@0.294.0`** (diciembre de 2023) declara como peer
`react "^16.5.1 || ^17.0.0 || ^18.0.0"`. La fase 1 subió a React 19, así que npm
dejó de poder resolver el árbol. En local no se notó porque el árbol ya
instalado seguía siendo válido y nadie volvió a instalar desde cero.

Arreglado en `f01b36d` subiendo a `lucide-react@^0.577.0`, la última de la rama
0.x. **No se subió a la 1.x** a propósito: retira los alias antiguos, y este
proyecto importa `AlertTriangle` y `AlertCircle`, que allí se llaman
`TriangleAlert` y `CircleAlert`.

**Moraleja para la próxima:** un despliegue que falla en menos de 5 segundos no
ha compilado nada. Antes de teorizar, leer el log del deploy.

### Las variables de Vercel, de paso

El alcance de entornos no era el problema, pero sí faltaban **dos variables
enteras**, que nunca habían existido allí:

- `SUPABASE_SERVICE_ROLE_KEY` — añadida como **Sensitive**, Production +
  Preview. Vercel no deja marcar Development en una variable sensible, y da
  igual: en local se lee de `.env.local`. Sin ella `supabaseAdmin` quedaba en
  `null`, así que **subir y borrar imágenes en producción no habría funcionado
  nunca**.
- `ADMIN_EMAILS` — añadida en todos los entornos.

Las otras cuatro ya estaban en "All Environments" y la anon key de Vercel
coincide con la de local.

---

## 3. Trampas que costaron encontrar

Esto es lo más valioso de este documento. Todo esto costó horas de diagnóstico.

**1. `.env.local` estaba guardado en UTF-16.** Next no puede parsearlo, así que
*ninguna* variable se cargaba en local. Por eso existían las credenciales
hardcodeadas en `lib/supabase.ts`: eran las que funcionaban de verdad. Ya está
en UTF-8 sin BOM. **Si lo editas con el Bloc de notas puede volver a UTF-16.**
Usa VS Code y comprueba que abajo a la derecha pone UTF-8.

**2. La `SUPABASE_SERVICE_ROLE_KEY` estaba mal escrita a mano.** El payload del
JWT decía `"rose":"service_role"` en vez de `"role"`. Un carácter, que además
invalida la firma. Toda llamada con `service_role` devolvía 401, lo que significa
que subir y borrar imágenes **nunca funcionó en local**. Ya corregida.
Detalle importante: la clave buena mide **exactamente los mismos 219
caracteres** que la rota, así que ninguna comprobación de longitud lo detecta.
Solo se ve decodificando el payload.

**3. Supabase retira el DNS de los proyectos pausados.** Durante la sesión el
host devolvía `Non-existent domain` en Google y Cloudflare, lo que parecía
proyecto eliminado. Estaba solo pausado por inactividad (plan gratuito). Abrir
el dashboard lo despierta. **En el plan gratuito se volverá a pausar**, y no hay
backups (`LAST BACKUP: No backups`): conviene una copia propia del catálogo.

**4. Las imágenes eran URLs firmadas que caducaban.** 24 de 27 apuntaban a
`/object/sign/...?token=` con vencimiento entre el 26 y el 29 de septiembre de
2026. Resuelto: bucket público y URLs reescritas a `/object/public/`. Si vuelves
a subir imágenes desde fuera de la app, **no uses URLs firmadas.**

**5. El `content` de `tailwind.config.js` tiene que incluir `lib/`.** Las clases
del testigo (`ann-ok`, `ann-warn`, `ann-dark`) se mapean desde `lib/stock.ts`.
Sin ese glob, Tailwind las purga y el testigo sale sin iluminar, sin ningún
error visible.

**6. `lucide-react` exporta un icono llamado `Image`** que choca con
`next/image`. Se importa como `ImageIcon` donde haga falta.

**7. Una dependencia vieja puede tumbar el despliegue sin tocar tu código.**
`lucide-react` 0.294.0 no admitía React 19 y reventaba `npm install` solo en
Vercel, porque en local el árbol ya instalado seguía valiendo. Ver la sección 2.
Cuando subas una versión mayor de React, repasa los peers de todo lo demás.

---

## 3 bis. Quién puede tocar qué (verificado el 05-08-2026)

Consultado con `pg_policies` sobre la base de datos real, no leído del
`schema.sql`, que está desfasado. Ocho políticas:

| Tabla | Política | Operación | Se cumple cuando |
|---|---|---|---|
| `products` | Products are viewable by everyone | SELECT | siempre |
| `products` | Admins can insert products | INSERT | el `sub` del JWT está en `admins.uuid` |
| `products` | Admins can update products | UPDATE | ídem |
| `products` | Admins can delete products | DELETE | ídem |
| `products` | Products are modifiable by admins only | ALL | **nunca** (mira abajo) |
| `categories` | Las categorías se leen sin sesión | SELECT | siempre |
| `product_images` | product_images_viewable_by_everyone | SELECT | siempre |
| `admin_sessions` | Admins can view own sessions | SELECT | nunca (tabla vacía) |

La política `ALL` compara contra `admin_sessions`, que está vacía y en la que
`AuthContext` nunca escribe, así que no se cumple jamás. **No es un agujero:**
las políticas se combinan con OR, de modo que una que nunca se cumple no
concede nada, y las tres de `authenticated` son las que hacen el trabajo. Se
puede borrar cuando se limpie el esquema, pero no corre prisa.

**Comprobado con peticiones reales usando la anon key:** `INSERT` en `products`
→ 401 `42501`; `UPDATE` → 0 filas; `INSERT` en `categories` → bloqueado;
lectura → 200. O sea, con la clave pública solo se puede leer.

### Por qué NO hay que rotar la anon key

Estaba en la lista de pendientes "porque estuvo hardcodeada en un repo
público". Se investigó y **no procede**:

- **Es pública por diseño.** Va incrustada en el bundle que producción sirve a
  cualquier visitante. Comprobado sobre los chunks reales del sitio en vivo.
  Estar además en el repo no añade exposición.
- **La `service_role` nunca se comiteó.** Barrido de todos los commits buscando
  JWTs: aparece uno solo, y su payload es `"role":"anon"`.
- **Su alcance lo pone RLS**, y RLS está cerrado a escritura (tabla de arriba).
- **Rotarla cuesta caro:** en las claves legacy, rotar la anon rota el secreto
  JWT, lo que regenera también la `service_role` e invalida todas las sesiones.
  Y al ser `NEXT_PUBLIC_` se incrusta al compilar, así que el sitio queda roto
  entre la rotación y el redespliegue.

Lo que sí seguiría importando: que la `service_role` se filtre. Verificado que
**no aparece** en ningún chunk servido al navegador.

---

## 4. Lo que se hizo (commiteado en `rediseno/panel-de-vuelo`)

### Fase 0 — Seguridad ✅

Las tres rutas de `/api/admin` usaban `service_role` (salta RLS) **sin
comprobar quién llamaba**: cualquiera podía subir o borrar imágenes.

- `lib/auth/requireAdmin.ts` verifica el token contra `/auth/v1/user` de
  Supabase, de modo que firma, caducidad y revocación las comprueba Supabase.
- `lib/adminFetch.ts` adjunta el token desde el cliente.
- Verificado con peticiones reales: sin cabecera → 401, token basura → 401, y el
  `POST` responde 401 **antes** que el 400 por falta de body, lo que confirma que
  la comprobación va delante de todo.

> **Invariante de la que depende esta seguridad.** La autoridad es Supabase
> Auth. Es seguro porque el **registro público está desactivado** y solo existe
> un usuario. `ADMIN_EMAILS` cierra la lista de forma explícita.
> **Si algún día activas "Allow new users to sign up", `ADMIN_EMAILS` pasa de
> ser un extra a ser lo único que separa un admin de cualquier registrado.**

> **Corrección del 05-08-2026.** Este documento decía que la tabla `admins`
> estaba vacía y que gatear por ella "dejaría fuera a todo el mundo". **Era
> falso.** Tiene una fila, su `uuid` coincide con el id del usuario de Auth y el
> correo también. Importa porque tres de las políticas RLS de `products`
> dependen de esa tabla y funcionan bien gracias a ella. Ver sección 3 bis.

### Fase 1 — Toolchain ✅

Next 14.0.4 → 15.5.22, React 18 → 19.2.8. Tailwind se queda en 3 a propósito.
`images.domains` → `remotePatterns`. Fuera credenciales hardcodeadas y ruido de
debug. Eliminado `lib/uploadImage.ts` (código muerto que subía saltándose la API).

### Fase 3 — Interfaz "Panel de vuelo" ✅

La disponibilidad es un testigo luminoso: verde con existencias, ámbar cuando
quedan pocas, lámpara apagada cuando está agotado. En un barrido de la rejilla
se ve qué queda sin leer una sola cifra.

- Tokens propios en `tailwind.config.js`, `globals.css` reconstruido encima.
- `ProductCard` descompuesto de 221 líneas a 4 piezas.
- `next/image` en todas partes, `components/ui/Dialog.tsx` accesible.
- Verificado con datos reales: 24 tarjetas, 27 imágenes, 23 testigos verdes y
  1 ámbar (el parche Hornet Azul y Amarillo, con 2 unidades).

Bugs arreglados: el `pointer-events-none` que mataba los controles de admin en
los agotados, el botón "Ver Detalles" sin handler, y el modal sin `role`/Escape/
focus trap.

### Categorías: de `CHECK` a tabla ✅ (05-08-2026)

El panel ofrecía "+ Crear nueva categoría" desde siempre, pero no podía
funcionar: fallaba en **cuatro capas a la vez**. El `CHECK` de la base de datos,
el tipo unión de `types/index.ts`, la lista escrita a mano de
`SearchAndFilters.tsx` (así que un producto en una categoría nueva habría sido
invisible salvo bajo "Todo"), y un `handleAddCategory` que solo tocaba un
`useState` local y se perdía al recargar.

Se eligió la **tabla `categories`** frente a relajar el `CHECK` o retirar la
opción, porque es la única que no hay que volver a tocar: mantiene la
integridad, y el nombre presentable y el orden dejan de vivir en el código.

- Migración en `supabase/migrations/20260805_categories_table.sql`, **ya
  aplicada** al proyecto de Supabase.
- Clave ajena con `ON UPDATE CASCADE` (renombrar un identificador arrastra a sus
  productos) y `ON DELETE RESTRICT` (no se borra una categoría con productos
  dentro).
- Lectura pública vía RLS; escribir exige `service_role` y pasa por
  `/api/admin/categories`, con `requireAdmin` igual que las rutas de imágenes.
- Verificado contra la base de datos real: categoría inexistente → `23503`;
  alta de categoría y producto dentro de ella → 201 (la primera vez que eso
  funciona); borrar categoría con productos → `23503`; escritura anónima →
  bloqueada por RLS. Las sondas se limpiaron: quedan las 4 categorías y los 24
  productos.
- La barra de filtros ya sale de la tabla, con "Miscelánea" acentuada.

**Para añadir una categoría sin pasar por el panel**, basta con insertar una
fila en `categories`: aparece sola en el filtro, en la posición que le pongas.

---

## 5. Lo que queda

Por orden de lo que haría primero:

1. **Prueba de extremo a extremo del gestor de imágenes.** Requiere contraseña,
   así que la tiene que hacer una persona: entrar como admin → *Imágenes* en
   cualquier tarjeta → ver miniaturas → subir y borrar una. Sería la primera vez
   que eso funciona en local.
2. **Repaso visual de la preview.** El build valida las variables de Supabase,
   pero nadie ha mirado la página desplegada. La preview está tras el SSO de
   Vercel, así que la tiene que abrir una persona con sesión.
3. ~~**Rotar la anon key.**~~ **Descartado el 05-08-2026, y no hay que volver a
   plantearlo.** Ver la sección 3 bis: la anon key es pública por diseño, la
   `service_role` nunca estuvo en el historial, y RLS bloquea toda escritura
   anónima. Rotarla no gana seguridad y sí cuesta una caída.
4. **Fase 2 — Estructura.** No empezada:
   - Colapsar los 3 contextos anidados. `ProductContext` envuelve a
     `SupabaseContext` sin aportar nada y mezcla estado de datos con estado de UI.
   - Catálogo a Server Component. Hoy todo es cliente y los productos se piden en
     un `useEffect` tras hidratar: se ve el layout vacío y luego aparecen.
   - Separar `lib/supabase/client.ts` y `server.ts`.
   - Reorganizar `components/` por dominio.
   - Código muerto: `initialProducts` en `ProductContext.tsx:10-55`.
5. **Fase 4 — Limpieza.** `README.md` describe persistencia en `localStorage` y
   "contraseña visual": nada de eso es cierto desde que se migró a Supabase Auth.
   Sobran 8 `.md` de andamiaje en la raíz (`PRUEBA_*.md`, `DEPLOY_STATUS.md`,
   `GUIA_VERCEL_DEPLOY.md`, `INSTRUCCIONES_RAPIDAS.md`, `TESTING.md`,
   `CONFIGURACION.md`). Decidir qué hacer con `generated-images/`.
6. **Deriva entre `supabase/schema.sql` y la realidad.** Lo de las categorías ya
   está al día. Queda: el schema declara `admins.password_hash NOT NULL`, pero
   la tabla real **no tiene esa columna** (es `uuid, email, name, created_at`),
   y le faltan las tres políticas de `products` para `authenticated` que sí
   existen en la base de datos. Ver sección 3 bis para el inventario real.
7. **Sin tests**, pese a que existe `TESTING.md`.
8. `caniuse-lite` 10 meses desactualizado; `update-browserslist-db` falla por un
   conflicto de peers. Solo es un aviso.

---

## 6. Cómo retomar

```bash
git checkout rediseno/panel-de-vuelo
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run build
```

Si el build falla quejándose de variables de entorno, el mensaje te dice qué
hacer en local y en Vercel.

**Respaldo:** `.artifacts/specs/2026-07-30-backup-product-images.json` guarda las
27 filas de `product_images` previas a pasar el bucket a público. Los tokens de
las URLs firmadas van redactados a propósito (son credenciales y el repositorio
es público); las rutas de los objetos, que es lo que hace falta para revertir,
están intactas.

**Para revertir el cambio del bucket:** poner `Products` en privado otra vez y
regenerar las firmas desde las rutas del respaldo.

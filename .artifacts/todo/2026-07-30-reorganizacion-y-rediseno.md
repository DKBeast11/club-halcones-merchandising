# Reorganización estructural y rediseño de interfaz

**Estado:** en curso — fases 1 y 3 hechas, backend recuperado
**Creado:** 2026-07-30
**Punto de partida:** commit `2c289fa` (21-oct-2025), 2.084 líneas / 21 archivos

## El backend: estaba pausado, no eliminado (resuelto 2026-07-30)

Durante un rato de esta sesión el host `abvziolumaqmacbfweci.supabase.co`
devolvía `Non-existent domain` en Google (8.8.8.8) y Cloudflare (1.1.1.1). Lo
diagnostiqué como proyecto **eliminado**; era incorrecto. Supabase **retira el
DNS de los proyectos pausados**, no solo de los eliminados. Al abrir el dashboard
el proyecto despertó, el DNS volvió y la API responde.

Estado real confirmado:
- Proyecto `club-halcones-merchandising`, región West EU (Paris), `t4g.nano`,
  estado **Healthy**.
- **Los datos están intactos**: 24 productos reales y 27 filas en
  `product_images`. No son los 4 del seed: son el catálogo de verdad (parches
  del 462 Escuadrón, Ala 46, lanyards, llaveros "Remove before flight"…).
- Dashboard: `LAST BACKUP: No backups`, `LAST MIGRATION: No migrations`.

Lección: en el plan gratuito el proyecto se vuelve a pausar por inactividad.
Conviene una copia de seguridad propia del catálogo, porque no hay backups.

## ⚠ La clave `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` es inválida

No es que haya caducado: **está mal escrita a mano**. El payload del JWT dice
`"rose":"service_role"` en vez de `"role":"service_role"`.

```
service_role (rota) : {"iss":"supabase","ref":"abvziolumaqmacbfweci","rose":"service_role",...}
anon        (buena) : {"iss":"supabase","ref":"abvziolumaqmacbfweci","role":"anon",...}
```

Un solo carácter cambiado, que además invalida la firma HMAC. La API responde
`401 Invalid API key`. Verificado que no lo causó la conversión de UTF-16 a
UTF-8: el valor es idéntico en la copia previa. Lleva rota desde que se escribió.

Consecuencia: `supabaseAdmin` se construye (la variable no está vacía) pero
**toda** llamada suya falla con 401. Es decir, la subida y el borrado de imágenes
en local nunca han podido funcionar. En producción sí, porque Vercel tiene sus
propias variables configuradas en el panel, no este archivo.

Arreglo (lo tiene que hacer Alexis, no toco credenciales): Supabase →
Settings → API Keys → pestaña "Legacy anon, service_role" → *Reveal* en
`service_role` → copiar y pegar en `.env.local`. Las claves legacy siguen
activas en este proyecto. Alternativa mejor a medio plazo: crear una *secret key*
del formato nuevo (`sb_secret_…`) y migrar a ella.

La `anon` key sí es válida y coincide exactamente con la que estaba hardcodeada
en `lib/supabase.ts`. Como estuvo en el repo público, conviene rotarla igualmente.

## ✅ RESUELTO: las imágenes ya no caducan (2026-07-30)

Ejecutado en este orden, con verificación entre pasos:

1. Respaldo de las 27 filas en
   `.artifacts/specs/2026-07-30-backup-product-images.json` (para revertir).
2. Comprobado que el bucket `Products` solo contenía CAMISETAS, LLAVEROS,
   MISCELANEA y PARCHES — nada privado — antes de exponerlo.
3. Bucket `Products` cambiado a público desde el dashboard.
4. Probadas 4 URLs públicas de carpetas distintas: las 4 a 200, **antes** de
   tocar la base de datos.
5. `UPDATE` en el editor SQL:
   ```sql
   UPDATE product_images
   SET image_url = split_part(replace(image_url, '/object/sign/', '/object/public/'), '?', 1)
   WHERE image_url LIKE '%/object/sign/%';
   ```
6. Verificado: 27/27 públicas, 0 firmadas, 0 tokens residuales, 27/27 a HTTP 200.

También corregido `app/api/admin/images/route.ts`: subía a un bucket
`product-images` aparte (vacío y descolgado del catálogo). Ahora sube a
`Products`, como el resto.

Para revertir: restaurar `image_url` desde el JSON de respaldo y volver a poner
el bucket en privado.

## ~~⚠ Las imágenes del catálogo caducan el 26-29 de septiembre de 2026~~ (histórico)

De las 27 filas de `product_images`, **24 son URLs firmadas** del tipo
`/storage/v1/object/sign/Products/…?token=…`, no públicas. Los tokens se
emitieron el 29-sep-2025 con 365 días de validez.

```
Primera caducidad: 2026-09-26   (~58 días desde hoy)
Última caducidad:  2026-09-29
Públicas (no caducan): 3
```

Cuando venzan, esas 24 imágenes darán 404 y el catálogo se quedará sin fotos.
Hay que decidir antes de finales de septiembre: hacer público el bucket
`Products` y reescribir las URLs a `/object/public/`, o regenerar las firmas
periódicamente. La primera opción es la sensata para un catálogo público.

Efecto colateral ya arreglado: `next.config.js` restringía `remotePatterns` a
`/storage/v1/object/public/**`, así que `next/image` rechazaba todas las URLs
firmadas. Ampliado a `/storage/v1/object/**`.

## ⚠ La tabla `admins` está vacía (0 filas)

Dato decisivo para la Fase 0: `admins` existe y es legible, pero **no tiene
ninguna fila**. `AuthContext:53-55` intenta insertar `{uuid, email}` tras cada
login y nunca comprueba el resultado; visto que la tabla sigue a cero, ese insert
siempre ha fallado en silencio (probablemente por el `password_hash NOT NULL` de
`schema.sql`, o por RLS).

Por eso la verificación de admin **no puede** limitarse a "existe en `admins`":
denegaría el acceso a todo el mundo, incluido tú. Hay que decidir antes:
poblar `admins` con el usuario real, arreglar el insert, o gatear por otra cosa.

## Decisión de fondo

No se empieza de 0. Se conserva la capa de datos (Supabase: schema, migraciones,
bucket, productos reales) y se reescribe la capa de presentación.

Razones para no reescribir todo:
- El activo real es el proyecto Supabase, y sobrevive igual en ambos escenarios.
- La lógica ya resuelta y probada en producción se volvería a pisar: autocreación
  del bucket `product-images`, cálculo de `position` al insertar imágenes,
  `price` que Supabase devuelve como string, orden de agotados al final.
- 2.084 líneas no dan deuda suficiente para un borrón y cuenta nueva.

Razones para sí reescribir la UI:
- No hay identidad visual que preservar: Tailwind por defecto
  (`gray-800` / `blue-600` / `blue-400`), emojis como iconos de categoría.
- `ProductCard.tsx` son 221 líneas con 4 responsabilidades (carrusel, tarjeta
  pública, controles de admin, modal). Reescribir sale más barato que refactorizar.

## Decisiones tomadas (2026-07-30)

- **Toolchain:** Next 15 + React 19, **Tailwind se queda en 3**. Sin salto a
  Tailwind 4 (cambiaría el formato de configuración a CSS-first justo antes del
  rediseño; una variable de riesgo de más).
- **Dirección visual:** a definir sobre propuestas concretas. Se exploran 2-3
  direcciones y se elige sobre algo visible, no en abstracto.

## Orden de las fases

El toolchain se actualiza **antes** de rediseñar, para no construir la UI dos veces.

### Fase 0 — Seguridad ✅ HECHA (2026-07-30)

- [x] `lib/auth/requireAdmin.ts`: verifica el token de Supabase Auth contra
      `/auth/v1/user` (firma, caducidad y revocación las comprueba Supabase, no
      nosotros) y aplica la lista blanca opcional `ADMIN_EMAILS`.
- [x] Las tres rutas (`GET`/`POST` en `images/route.ts`, `DELETE` en
      `images/[id]/route.ts`) rechazan con 401 antes de procesar nada.
- [x] `lib/adminFetch.ts`: el cliente adjunta el token de la sesión. Si no hay
      sesión, falla con un mensaje legible en vez de un 401 opaco.
      Usado por `ImageManager` (3 llamadas) y `AdminPanel` (1).
- [x] Credenciales hardcodeadas fuera de `lib/supabase.ts` (hecho en Fase 1).
- [x] Verificado con peticiones reales: sin cabecera → 401, token basura → 401,
      y el `POST` responde 401 **antes** que el 400 por falta de body, lo que
      confirma que la comprobación va delante de todo lo demás.
- [ ] Rotar la anon key: estuvo en el repo público. Sigue pendiente.

**Decisión de diseño y su invariante.** La autoridad es Supabase Auth, no la
tabla `admins` (está vacía; gatear por ella dejaría fuera a todo el mundo). Es
seguro porque el registro público está **desactivado** y solo existe un usuario,
así que el conjunto de quien puede autenticarse es cerrado. `ADMIN_EMAILS`
(puesto a `alexisdrako@gmail.com`) cierra la lista de forma explícita para que
la seguridad no dependa solo de esa invariante. **Si algún día se reactiva
"Allow new users to sign up", `ADMIN_EMAILS` pasa de ser un extra a ser lo
único que separa a un admin de cualquier registrado.**

### Fase 1 — Toolchain ✅ HECHA (2026-07-30)

- [x] Next 14.0.4 → **15.5.22**, React 18 → **19.2.8**, `eslint-config-next` a la par.
      Tailwind se queda en 3.4.17 por decisión explícita.
- [x] `.env.local` **estaba guardado en UTF-16**: Next no puede parsearlo, así que
      esas variables nunca se cargaron en local. Reguardado en UTF-8 sin BOM
      (1548 → 775 bytes). Explica por qué existían las credenciales hardcodeadas
      y por qué `supabaseAdmin` era siempre `null` fuera de Vercel.
- [x] `next.config.js`: `images.domains` → `remotePatterns`, derivando el host
      de `NEXT_PUBLIC_SUPABASE_URL` en vez de escribirlo a mano.
- [x] Credenciales hardcodeadas fuera de `lib/supabase.ts`. Ahora falla con un
      mensaje claro si faltan las variables, en vez de apuntar en silencio a prod.
- [x] Ruido de debug eliminado (la consulta `count` en cliente y los ~10
      `console.log` por request de la ruta de imágenes). Se conserva `console.error`.
- [x] Cambios que Next 15 obliga: `viewport` sale de `metadata` a su propio
      export, y los `params` de rutas dinámicas pasan a ser `Promise`.
- [x] `lib/uploadImage.ts` eliminado: código muerto que además subía al bucket
      saltándose la API.
- [ ] `caniuse-lite` sigue 10 meses desactualizado; `update-browserslist-db`
      falla por un conflicto de peers. Es solo un aviso, no rompe el build.

### Fase 2 — Estructura

- [ ] Colapsar los 3 contextos anidados. `ProductContext` envuelve a
      `SupabaseContext` sin aportar nada (indirección pass-through) y además
      mezcla estado de datos con estado de UI (`searchTerm`, `selectedCategory`,
      `showAddProduct`, `editingProduct`, `newProduct`).
- [ ] Unificar la fuente de verdad de `isAdmin`: hoy sale de `ProductContext`
      mientras la autenticación vive en `AuthContext`.
- [ ] Catálogo a Server Component con fetch en servidor. Hoy 12 de 21 archivos
      llevan `'use client'` y los productos se piden en un `useEffect` tras
      hidratar: el usuario ve el layout vacío y luego aparecen los productos.
- [ ] Separar `lib/supabase/client.ts` y `lib/supabase/server.ts`.
- [ ] Reorganizar `components/` por dominio (`catalog/`, `admin/`, `ui/`).

### Fase 3 — Interfaz nueva ✅ HECHA (2026-07-30)

Dirección elegida: **"Panel de vuelo"**. La descartada, "Panel de parches", vive
en la rama `diseno/panel-de-parches`.

- [x] Tokens propios en `tailwind.config.js`: paleta `panel` / `legend` /
      `signal`, tipografías `legend` (Bahnschrift, la DIN de las placas de
      cabina) y `data` (Consolas), y el keyframe `bist`.
- [x] `app/globals.css` reconstruido sobre esos tokens: `.surface`, `.engraved`,
      `.legend-btn`, `.ann*` (el testigo) y foco visible global.
- [x] `next/image` adoptado en todas partes. Colisión de nombres resuelta
      renombrando el icono de lucide a `ImageIcon`.
- [x] `ProductCard` descompuesto (221 líneas → 4 piezas): `ProductCard`,
      `ProductCarousel`, `StockAnnunciator`, `AdminStockControls`.
- [x] `components/ui/Dialog.tsx` nuevo: focus trap, cierre con Escape, devuelve
      el foco al abridor, bloquea el scroll de fondo, soporta `data-autofocus`.
      Lo usan el login y el gestor de imágenes.
- [x] Bug arreglado: los agotados ya no llevan `pointer-events-none`, así que
      los controles de admin funcionan justo cuando hace falta reponer.
- [x] Botón "Ver Detalles" eliminado: no tenía handler, no hacía nada.
- [x] `alert()` sustituido por mensajes en línea en el gestor de imágenes.
- [x] Borrar producto pasa a ser un **interruptor protegido** (dos pasos), en
      vez de borrar al primer clic sin confirmación.
- [x] `isLoading` y `error` expuestos por `ProductContext`: la rejilla ya no
      dice "no hay productos" mientras está cargando o cuando falla la carga.

### Fase 4 — Limpieza

- [ ] Reescribir `README.md`: describe persistencia en `localStorage` y
      "modo administrador con contraseña visual". Ninguna de las dos cosas es
      cierta desde que se migró a Supabase Auth. También dice
      "Próximamente en Vercel" estando ya en producción.
- [ ] Retirar los 8 `.md` de andamiaje de la raíz: `PRUEBA_LOGIN.md`,
      `PRUEBA_SESION.md`, `PRUEBA_SUPABASE.md`, `DEPLOY_STATUS.md`,
      `GUIA_VERCEL_DEPLOY.md`, `INSTRUCCIONES_RAPIDAS.md`, `TESTING.md`,
      `CONFIGURACION.md`.
- [ ] Decidir qué hacer con `generated-images/`, versionado en el repo.
- [ ] Revisar la deriva entre `supabase/schema.sql` y la app: el schema define
      `admins.password_hash` y políticas RLS de `products` que dependen de
      `admin_sessions.session_token`, pero `AuthContext` usa Supabase Auth y
      nunca escribe en `admin_sessions`. La política de escritura de `products`
      probablemente no hace lo que dice.

## Detectado durante la Fase 3 (sin resolver)

- **Las categorías nuevas no pueden funcionar.** `AdminPanel` deja crear
  categorías propias, pero `supabase/schema.sql` define
  `CHECK (category IN ('parches','camisetas','llaveros','miscelanea'))`. Cualquier
  categoría fuera de esas cuatro será rechazada por la base de datos al insertar.
  Se ha conservado la funcionalidad en la interfaz, pero hay que decidir: o tabla
  de categorías, o relajar el CHECK, o retirar la opción. Requiere backend.
- `lucide-react` está en 0.294.0 (diciembre de 2023) y le faltan iconos que ya
  existen en versiones actuales. No se ha subido para no ampliar el alcance.
- `context/ProductContext.tsx:10-55` tiene un array `initialProducts` que no usa
  nadie: los productos vienen de `useSupabase`. Código muerto, va en la Fase 2.

## Bugs detectados de paso

- `components/ProductCard.tsx:23` — los agotados llevan `pointer-events-none`
  en el `<article>` entero. Como admin no puedes gestionar imágenes ni eliminar
  un producto agotado: los botones se renderizan pero están muertos.
- `components/ProductCard.tsx:200` — el modal de gestión de imágenes no tiene
  `role="dialog"`, ni cierre con Escape, ni focus trap. `LoginModal` sí los
  tiene; este se quedó a medias.
- `components/ProductCard.tsx:126` — el botón "Ver Detalles" no tiene handler,
  no hace nada.

## Notas

- Cada mutación (`addProduct`, `updateProduct`, `deleteProduct`, `updateStock`)
  hace un `loadProducts()` completo. Aceptable al tamaño actual del catálogo;
  no es prioridad.
- El filtrado y el orden se hacen en cliente sobre todo el catálogo
  (`ProductGrid.tsx`). Igual: aceptable ahora, a revisar si crece.

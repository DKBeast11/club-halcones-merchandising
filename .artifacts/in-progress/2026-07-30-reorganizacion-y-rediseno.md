# Reorganización y rediseño de Club Halcones

**Última sesión:** 2026-07-30
**Punto de partida:** `2c289fa` (21-oct-2025) — 2.084 líneas, 21 archivos
**Estado:** fases 0, 1 y 3 hechas y commiteadas en rama. Sin fusionar ni desplegar.

---

## 1. Cómo está todo ahora mismo

### Ramas

| Rama | Estado | Qué es |
|---|---|---|
| `main` | `2c289fa`, intacta | Lo que hay en producción. No se ha tocado. |
| `rediseno/panel-de-vuelo` | `7907df4`, **subida** | El trabajo de esta sesión. 5 commits. |
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
- **Vercel**: producción desplegada desde `main` (último deploy: 21-oct-2025).
  La preview de la rama **falla** — ver bloqueante abajo.

---

## 2. ⚠ Bloqueante para retomar

**La preview de Vercel no construye.** Las variables de Supabase están
configuradas solo para el entorno *Production*, no para *Preview*.

Desde que se quitaron las credenciales hardcodeadas, `lib/supabase.ts` falla el
build si faltan. Eso es deliberado: al ser variables `NEXT_PUBLIC_` se incrustan
al compilar, así que si faltan la aplicación queda rota en ejecución igualmente.
Mejor enterarse antes de desplegar.

**Arreglo:** Vercel → `club-halcones-merchandising` → Settings → Environment
Variables. Marcar **Production, Preview y Development** en las tres:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Y de paso, comprobar si la `SUPABASE_SERVICE_ROLE_KEY` de Vercel tiene la
errata** (ver trampa nº 2). Si es la misma que había en local, la subida de
imágenes en producción lleva rota desde siempre. Nunca se llegó a verificar.

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
`next/image`. Se importa como `ImageIcon` donde haga falta. La versión instalada
(0.294.0, dic-2023) no tiene el icono `Images` en plural.

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
> Auth, no la tabla `admins` (está vacía; gatear por ella dejaría fuera a todo
> el mundo). Es seguro porque el **registro público está desactivado** y solo
> existe un usuario. `ADMIN_EMAILS` cierra la lista de forma explícita.
> **Si algún día activas "Allow new users to sign up", `ADMIN_EMAILS` pasa de
> ser un extra a ser lo único que separa un admin de cualquier registrado.**

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

---

## 5. Lo que queda

Por orden de lo que haría primero:

1. **Desbloquear la preview** (sección 2) y comprobar la clave de Vercel.
2. **Prueba de extremo a extremo del gestor de imágenes.** Requiere contraseña,
   así que la tiene que hacer una persona: entrar como admin → *Imágenes* en
   cualquier tarjeta → ver miniaturas → subir y borrar una. Sería la primera vez
   que eso funciona en local.
3. **Rotar la anon key.** Estuvo hardcodeada en un repo público.
4. **Las categorías nuevas no pueden funcionar.** `AdminPanel` deja crearlas,
   pero el schema tiene `CHECK (category IN ('parches','camisetas','llaveros',
   'miscelanea'))`. Cualquier otra la rechaza la base de datos al insertar. Hay
   que decidir: tabla de categorías, relajar el CHECK, o retirar la opción.
5. **Fase 2 — Estructura.** No empezada:
   - Colapsar los 3 contextos anidados. `ProductContext` envuelve a
     `SupabaseContext` sin aportar nada y mezcla estado de datos con estado de UI.
   - Catálogo a Server Component. Hoy todo es cliente y los productos se piden en
     un `useEffect` tras hidratar: se ve el layout vacío y luego aparecen.
   - Separar `lib/supabase/client.ts` y `server.ts`.
   - Reorganizar `components/` por dominio.
   - Código muerto: `initialProducts` en `ProductContext.tsx:10-55`.
6. **Fase 4 — Limpieza.** `README.md` describe persistencia en `localStorage` y
   "contraseña visual": nada de eso es cierto desde que se migró a Supabase Auth.
   Sobran 8 `.md` de andamiaje en la raíz (`PRUEBA_*.md`, `DEPLOY_STATUS.md`,
   `GUIA_VERCEL_DEPLOY.md`, `INSTRUCCIONES_RAPIDAS.md`, `TESTING.md`,
   `CONFIGURACION.md`). Decidir qué hacer con `generated-images/`.
7. **Deriva entre `supabase/schema.sql` y la realidad.** El schema define
   `admins.password_hash NOT NULL` y políticas RLS de `products` que dependen de
   `admin_sessions.session_token`, pero `AuthContext` usa Supabase Auth y nunca
   escribe en `admin_sessions`. Esa política probablemente no hace lo que dice.
8. **Sin tests**, pese a que existe `TESTING.md`.
9. `caniuse-lite` 10 meses desactualizado; `update-browserslist-db` falla por un
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

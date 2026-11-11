---
name: tests
description: Escribir, ampliar y ejecutar los tests de Club Halcones (Playwright Test para unitarios y e2e). Úsala siempre que se añada o cambie código en app/, lib/, components/ o context/, al arreglar un bug (cada bug lleva su test de regresión), o cuando pidan "probar", "testear", "comprobar que funciona" o "añadir tests".
---

# Tests de Club Halcones

Un solo runner: **Playwright Test** (`@playwright/test`, versión fijada).
Hace de runner de unitarios (sin navegador) y de e2e (con navegador).
Vitest no se usa: npm 11 revienta al resolver sus peers (`edgesOut`).

| Orden | Qué corre | Cuándo |
|---|---|---|
| `npm run test:unit` | `tests/unit/` — funciones puras de `lib/` | Siempre. Tarda ~3 s |
| `npm run test:e2e` | `tests/e2e/visitor.spec.ts` — solo lectura | Al tocar páginas, componentes o rutas |
| `npm run test:admin` | `tests/e2e/admin.spec.ts` — escribe en la BD real | Al tocar el panel, `CatalogContext`, `/api/admin/*` o RLS |
| `npm test` | unitarios + visitante | Antes de commitear |

Los e2e compilan la app (`next build`) y la arrancan en el puerto 3100. Si
ya hay algo escuchando ahí, lo **reutilizan**: después de cambiar código,
mata ese servidor o probarás el build viejo.

La CI (`.github/workflows/tests.yml`) corre tipos, lint, unitarios, build y
e2e de visitante en cada push y PR. Los de admin solo corren en local.

## Regla: cada bug, su test

Al arreglar un bug, primero el test que falla y luego el arreglo. En el test,
un comentario de una o dos líneas que diga **qué pasaba antes**. Así nadie lo
"simplifica" sin saber por qué existe. Ejemplos ya en el repo: la carrera del
stock, la columna `image_url` inexistente y el cierre de sesión que no
invalidaba el token.

## Dónde va cada test

- **Lógica pura** (mapeos, validaciones, conversiones): sácala a `lib/` si
  no lo está y pruébala en `tests/unit/`. Es lo más barato.
- **Rutas `/api/admin/*`**: la denegación sin sesión va en `visitor.spec.ts`
  (lista "las rutas de admin rechazan…"). **Toda ruta nueva se añade ahí.**
  El comportamiento con sesión va en `admin.spec.ts`.
- **Flujos de admin**: `admin.spec.ts`. Van en serie y comparten página y
  producto. Añade pasos al final, antes del de cerrar sesión, que tiene que
  ser el último.

## Reglas para no romper producción

Los e2e apuntan al **Supabase real** de `.env.local`.

- Los tests de admin **solo crean y tocan productos cuyo nombre empieza por
  `E2E `** (`E2E_PREFIX` en `tests/e2e/support.ts`). Nunca edites ni borres
  un producto que no hayas creado en el test.
- `cleanupE2EProducts()` corre antes y después de la suite y borra productos
  `E2E `, sus filas de imágenes y sus ficheros del bucket.
- Las imágenes se generan en memoria con `pngFile()`. No subas binarios al repo.
- Para simular fallos del servidor, intercepta con `page.route` en vez de
  romper datos de verdad (ver "si el cambio de stock no se guarda…").

## La cuenta de tests

`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` en `.env.local` (fuera de git).
Es un usuario de Supabase Auth creado solo para esto, con fila en `admins` y
añadido a `ADMIN_EMAILS` **solo en `.env.local`**: en Vercel no está, así que
en producción no pasa `/api/admin/*`. Sí puede escribir en `products` vía
RLS. Si se filtra la contraseña, se borra el usuario en Supabase → Authentication.

Sin esas variables, `admin.spec.ts` se salta solo.

## Trampas conocidas al escribir selectores

- **Mayúsculas por CSS**: `innerText` devuelve "PARCHES" aunque el nombre
  accesible sea "Parches". Usa `textContent` / `getByRole({ name })`.
- **`role="alert"` fantasma**: Next mete un anunciador de rutas vacío con
  `role="alert"`. Acota con `page.getByRole('main').getByRole('alert')`.
- **Dos botones "Cerrar sesión"** (cabecera y barra de sesión): usa
  `page.getByRole('banner').getByRole('button', …)`.
- **`getByLabel(/contraseña/i)`** también casa con el botón "Mostrar
  contraseña": usa `#admin-password`.
- **RLS no da error** en UPDATE/DELETE bloqueados: devuelve 0 filas. Para
  comprobar que algo se guardó, léelo con `readProduct()` (anon key), no te
  fíes de lo que pinta la interfaz.
- **`tsconfig` tiene `target: es5`** y `next build` comprueba también los
  tests: nada de `[...new Set()]`; usa `Array.from(new Set())`.
- **La recarga cierra la sesión de admin** (es así a propósito): no recargues
  a mitad de `admin.spec.ts`.

## Plantilla de test de regresión

```ts
test('<qué debe pasar, en positivo>', async () => {
  // Antes: <qué pasaba>. <Por qué importa, si no es obvio>.
  await …acción…;
  await expect(…interfaz…).…;
  await expect.poll(async () => (await readProduct(PRODUCT))?.campo).toBe(…); // y en la BD
});
```

Al acabar, ejecuta la batería que toque según la tabla y comprueba que no
quedan productos `E2E ` ni ficheros sueltos en la raíz del bucket.

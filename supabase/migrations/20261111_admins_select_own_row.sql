-- Cada usuario autenticado puede leer SU fila de `admins`, y nada más.
--
-- Las políticas de escritura de `products` ("Admins can insert/update/delete
-- products") comprueban
--   EXISTS (SELECT 1 FROM admins WHERE admins.uuid = <sub del JWT>)
-- Esa subconsulta se ejecuta con los permisos de quien llama, así que le
-- aplica el RLS de `admins`. Y `admins` tenía RLS activado sin ninguna
-- política: la subconsulta no veía filas nunca, y ningún admin podía crear,
-- editar ni borrar productos desde el panel. RLS no da error en UPDATE ni
-- DELETE, así que el fallo era silencioso; solo el INSERT avisaba.
--
-- Lo destaparon los tests e2e el 11-11-2026 (tests/e2e/admin.spec.ts).
--
-- Leer la propia fila no expone nada: es tu uuid y tu correo.

CREATE POLICY "Cada usuario ve su propia fila de admins"
  ON admins
  FOR SELECT
  TO authenticated
  USING (uuid = auth.uid());

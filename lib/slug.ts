/**
 * Convierte el nombre visible de una categoria en su identificador.
 *
 * "Miscelanea" -> "miscelanea", "Gorras y Viseras" -> "gorras-y-viseras".
 *
 * Los identificadores que ya existen ('parches', 'camisetas', 'llaveros',
 * 'miscelanea') salen tal cual de sus nombres, asi que la tabla sigue casando
 * con lo que `products.category` ya tenia guardado.
 */
export function toSlug(name: string): string {
  return (
    name
      .normalize('NFD')
      // Fuera los diacriticos que NFD acaba de separar en su propio caracter:
      // la e con tilde se queda en "e", igual que se hacia a mano al escribir
      // 'miscelanea'. El rango es el bloque de marcas combinantes.
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) // El id es VARCHAR(50) en la base de datos.
  );
}

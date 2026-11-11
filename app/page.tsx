import MerchandiseCatalog from '@/components/catalog/MerchandiseCatalog';
import { CatalogProvider } from '@/context/CatalogContext';
import { fetchCatalog } from '@/lib/catalog';
import { supabase } from '@/lib/supabase/client';

// El catálogo se lee en el servidor y la página sale ya con los productos.
// Antes todo era cliente: se pintaba el esqueleto vacío, hidrataba, y solo
// entonces un useEffect pedía los productos.
//
// Se regenera como mucho cada 60 s (ISR). Los cambios del admin los ve él al
// instante, porque actualizan el estado del cliente; el resto de visitantes,
// en menos de un minuto. Si la lectura falla al regenerar, Next sigue
// sirviendo la última versión buena en vez de una página de error.
//
// Ojo: el build también lee el catálogo, así que con Supabase pausado el
// despliegue falla. El cron de /api/keepalive está para que no pase.
export const revalidate = 60;

export default async function Home() {
  const catalog = await fetchCatalog(supabase);

  return (
    <CatalogProvider initial={catalog}>
      <MerchandiseCatalog />
    </CatalogProvider>
  );
}

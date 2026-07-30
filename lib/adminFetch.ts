'use client';

import { supabase } from '@/lib/supabase';

/**
 * `fetch` para las rutas de /api/admin: adjunta el token de la sesión actual
 * de Supabase Auth, que es lo que el servidor verifica.
 *
 * Lanza si no hay sesión, para que la interfaz muestre el fallo en vez de
 * mandar una petición que el servidor va a rechazar con un 401 opaco.
 */
export async function adminFetch(input: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Tu sesión ha caducado. Vuelve a entrar como admin.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);

  return fetch(input, { ...init, headers });
}

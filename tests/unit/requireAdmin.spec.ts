import { test, expect } from '@playwright/test';

// requireAdmin lee las variables al importarse, así que se fijan antes y el
// módulo se importa después, una sola vez.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proyecto.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
process.env.ADMIN_EMAILS = 'Admin@Club.test, otro@club.test';

const load = () => import('@/lib/auth/requireAdmin');

const realFetch = globalThis.fetch;
let calls: { url: string; auth: string | null }[] = [];

/** Simula la respuesta de Supabase Auth a GET /auth/v1/user. */
function mockAuth(response: { status: number; body?: unknown } | Error) {
  calls = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), auth: new Headers(init?.headers).get('Authorization') });
    if (response instanceof Error) throw response;
    return new Response(JSON.stringify(response.body ?? {}), { status: response.status });
  }) as typeof fetch;
}

test.afterEach(() => {
  globalThis.fetch = realFetch;
});

const req = (auth?: string) =>
  new Request('http://localhost/api/admin/x', { headers: auth ? { authorization: auth } : {} });

test('sin cabecera Authorization deniega sin preguntar a Supabase', async () => {
  const { requireAdmin } = await load();
  mockAuth({ status: 200, body: { id: 'u', email: 'admin@club.test' } });
  expect(await requireAdmin(req())).toBeNull();
  expect(await requireAdmin(req('Basic abc'))).toBeNull();
  expect(calls).toHaveLength(0);
});

test('un token que Supabase rechaza deniega', async () => {
  const { requireAdmin } = await load();
  mockAuth({ status: 401 });
  expect(await requireAdmin(req('Bearer basura'))).toBeNull();
  expect(calls[0]).toEqual({ url: 'https://proyecto.supabase.co/auth/v1/user', auth: 'Bearer basura' });
});

test('un usuario válido que no está en ADMIN_EMAILS deniega', async () => {
  const { requireAdmin } = await load();
  mockAuth({ status: 200, body: { id: 'u', email: 'cualquiera@club.test' } });
  expect(await requireAdmin(req('Bearer ok'))).toBeNull();
});

test('un usuario de ADMIN_EMAILS pasa, sin distinguir mayúsculas', async () => {
  const { requireAdmin } = await load();
  mockAuth({ status: 200, body: { id: 'u1', email: 'admin@CLUB.test' } });
  expect(await requireAdmin(req('bearer ok'))).toEqual({ id: 'u1', email: 'admin@CLUB.test' });
});

test('si Supabase no responde, deniega en vez de reventar', async () => {
  const { requireAdmin } = await load();
  mockAuth(new Error('ECONNREFUSED'));
  expect(await requireAdmin(req('Bearer ok'))).toBeNull();
});

test('unauthorized responde 401', async () => {
  const { unauthorized } = await load();
  expect(unauthorized().status).toBe(401);
});

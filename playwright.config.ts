import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// Tests de extremo a extremo: levantan la app compilada y la recorren con un
// navegador. Los unitarios tienen su propia config (playwright.unit.config.ts)
// para no esperar a un build que no necesitan.
//
//   npm run test:e2e     visitante: solo lectura, no necesita credenciales
//   npm run test:admin   panel de admin: crea y borra su propio producto
//
// Ojo: la app apunta al Supabase de verdad (el de .env.local). Los tests de
// visitante solo leen. Los de admin solo tocan productos que crean ellos,
// con el nombre empezando por "E2E ", y los borran al acabar.

loadEnvConfig(process.cwd());

const PORT = 3100;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'es-ES',
  },
  projects: [
    {
      name: 'visitante',
      testIgnore: /admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      // Un solo flujo que comparte producto entre pasos: en serie.
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Se prueba el build de producción, no `next dev`: es lo que se despliega,
    // y el catálogo se genera en el servidor solo en el build.
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/keepalive`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

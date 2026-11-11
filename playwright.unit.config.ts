import { defineConfig } from '@playwright/test';

// Tests unitarios: funciones puras de lib/, sin navegador ni servidor.
// Playwright Test hace aquí de runner (entiende TypeScript y los alias @/ de
// tsconfig), así el proyecto tiene una sola herramienta de tests.
//
//   npm run test:unit

export default defineConfig({
  testDir: './tests/unit',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
});

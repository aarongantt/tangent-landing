import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the TANGENT landing site.
 *
 * The site is static HTML that talks to a LIVE Stripe (pk_live_…) + prod Supabase,
 * so the fixtures BLOCK all external network — no real users/charges are ever
 * created. No browser extension here, so this runs headless (fast).
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['blob'], ['list']] : [['html', { open: 'never' }], ['list']],

  // Serve the static site locally via a tiny concurrent node server (handles
  // parallel workers + /account-style directory paths; no extra deps).
  webServer: {
    command: 'node tests/static-server.cjs',
    url: 'http://127.0.0.1:4321/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

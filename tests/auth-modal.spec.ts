import { test, expect, installSupabaseStub } from './fixtures';

/**
 * Landing auth modal (auth-modal.js). `window.openLoginModal()` opens
 * `#tg-login-modal`; handleAuth() calls window.supabaseClient.auth and writes the
 * outcome into `#tgLoginStatus` (success → redirect to /account). We stub
 * supabaseClient so no real auth call is made.
 */
const AUTH_PAGE = '/how-it-works.html'; // includes auth-modal.js

async function openModal(page: any) {
  await page.evaluate(() => (window as any).openLoginModal());
  await expect(page.locator('#tg-login-modal')).toBeVisible({ timeout: 8000 });
}

test('empty fields show a validation message', async ({ page }) => {
  await installSupabaseStub(page);
  await page.goto(AUTH_PAGE);
  await openModal(page);
  await page.locator('#tgLoginSignIn').click();
  await expect(page.locator('#tgLoginStatus')).toContainText(/enter email and password/i);
});

test('a sign-in error from Supabase is surfaced to the user', async ({ page }) => {
  await installSupabaseStub(page, { signInError: 'Invalid login credentials' });
  await page.goto(AUTH_PAGE);
  await openModal(page);
  await page.locator('#tgLoginEmail').fill('user@example.com');
  await page.locator('#tgLoginPassword').fill('wrongpass');
  await page.locator('#tgLoginSignIn').click();
  await expect(page.locator('#tgLoginStatus')).toContainText(/invalid login credentials/i);
});

test('a successful sign-in redirects to /account', async ({ page }) => {
  await installSupabaseStub(page, { signInError: null });
  await page.goto(AUTH_PAGE);
  await openModal(page);
  await page.locator('#tgLoginEmail').fill('user@example.com');
  await page.locator('#tgLoginPassword').fill('correct-horse');
  await page.locator('#tgLoginSignIn').click();
  await page.waitForURL(/\/account/, { timeout: 8000 });
});

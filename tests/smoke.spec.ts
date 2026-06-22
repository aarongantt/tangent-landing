import { test, expect } from './fixtures';

/**
 * Landing smoke — key marketing pages render their static content with ALL
 * external network blocked (proves the core pages don't hard-depend on the
 * Stripe/Supabase CDNs to render).
 */
const PAGES = ['/index.html', '/faq.html', '/download.html', '/how-it-works.html'];

for (const path of PAGES) {
  test(`page ${path} loads and renders substantial content`, async ({ page }) => {
    const resp = await page.goto(path);
    expect(resp?.status()).toBeLessThan(400);
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(150);
  });
}

test('signup page renders the plan cards', async ({ page }) => {
  await page.goto('/signup/index.html');
  // Plan buttons carry data-plan (free_trial / pro_* / business_*).
  await expect(page.locator('[data-plan]').first()).toBeVisible({ timeout: 8000 });
  const plans = await page.locator('[data-plan]').evaluateAll((els) => els.map((e) => e.getAttribute('data-plan')));
  expect(plans).toEqual(expect.arrayContaining(['free_trial', 'pro_monthly', 'pro_annual']));
});

import { test, expect, installSupabaseStub, installStripeStub } from './fixtures';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Stripe checkout wiring on /signup. PRICE_IDS lives in a page IIFE (not on
 * window), so we parse it from source for the expected values, then drive the
 * REAL plan click and assert the exact price id reaches /api/create-subscription.
 * A wrong/missing/duplicate price id = a wrong charge — the highest-value guard
 * on the whole landing site. Everything network is mocked (no real subscription).
 */
function parsePriceIds(): Record<string, string> {
  const src = fs.readFileSync(path.join(__dirname, '..', 'signup', 'index.html'), 'utf8');
  const block = src.match(/var\s+PRICE_IDS\s*=\s*\{([\s\S]*?)\}/);
  if (!block) throw new Error('PRICE_IDS block not found in signup/index.html');
  const map: Record<string, string> = {};
  for (const m of block[1].matchAll(/(\w+)\s*:\s*["']([^"']+)["']/g)) map[m[1]] = m[2];
  return map;
}

const PRICE_IDS = parsePriceIds();
const EXPECTED_PLANS = [
  'pro_monthly', 'pro_annual',
  'business_solo_monthly', 'business_solo_annual',
  'business_team_monthly', 'business_team_annual',
];

test('every paid plan maps to a distinct Stripe price id', () => {
  for (const plan of EXPECTED_PLANS) {
    expect(PRICE_IDS[plan], `priceId for ${plan}`).toMatch(/^price_[A-Za-z0-9]+$/);
  }
  const ids = EXPECTED_PLANS.map((p) => PRICE_IDS[p]);
  expect(new Set(ids).size, 'every plan has a distinct price id').toBe(ids.length);
});

test('clicking pro_monthly starts checkout with the pro_monthly price id', async ({ page }) => {
  let captured: any = null;
  // Registered after the fixture catch-all → wins for this URL.
  await page.route('**/api/create-subscription', (route) => {
    try { captured = route.request().postDataJSON(); } catch { captured = {}; }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clientSecret: 'seti_test_secret', subscriptionId: 'sub_test' }) });
  });
  await installSupabaseStub(page, { loggedIn: true });
  await installStripeStub(page);
  await page.goto('/signup/index.html');

  await page.locator('.plan-button[data-plan="pro_monthly"]').first().click();

  await expect(page.locator('#tangent-payment-modal')).toBeVisible({ timeout: 8000 });
  await expect.poll(() => captured?.priceId, { timeout: 8000 }).toBe(PRICE_IDS.pro_monthly);
});

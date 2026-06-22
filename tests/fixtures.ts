import { test as base, expect as baseExpect, type Page } from '@playwright/test';

/**
 * Landing-site fixtures. The live site embeds a pk_live_ Stripe key + prod
 * Supabase, so the `page` fixture BLOCKS every non-localhost request — nothing
 * external is ever hit (no real users, no real charges). External scripts/styles
 * are stubbed empty so pages still render their static content; SDK-dependent
 * flows (auth, payment) get explicit stubs via the helpers below.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.context().route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      if (host === '127.0.0.1' || host === 'localhost') return route.continue();

      const type = route.request().resourceType();
      if (type === 'script') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* external blocked in tests */' });
      if (type === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      if (type === 'image' || type === 'font' || type === 'media') return route.fulfill({ status: 200, body: '' });
      // xhr/fetch (Supabase, Stripe, /api, analytics) → empty JSON
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await use(page);
  },
});

export const expect = baseExpect;

/**
 * Stub window.Stripe + window.supabase BEFORE load so the signup page's payment
 * script runs to completion without the real (live-key) Stripe.js / Supabase UMD,
 * which the fixture blocks. The fake Stripe returns inert elements; we only care
 * that the page reaches the /api/create-subscription call with the right priceId.
 */
export async function installStripeStub(page: Page) {
  await page.addInitScript(() => {
    const el = { mount() {}, unmount() {}, on() {}, update() {}, destroy() {} };
    (window as any).Stripe = () => ({
      elements: () => ({ create: () => el, getElement: () => el, submit: async () => ({}) }),
      confirmPayment: async () => ({ error: { message: 'blocked in tests' } }),
      confirmSetup: async () => ({ error: { message: 'blocked in tests' } }),
    });
    (window as any).supabase = { createClient: () => (window as any).supabaseClient };
  });
}

/**
 * Inject a fake `window.supabaseClient` BEFORE the page loads so the auth modal
 * (auth-modal.js → window.supabaseClient.auth.signInWithPassword/signUp) runs
 * without the real SDK/network. Records calls on window.__authCalls and returns
 * the configured result.
 */
export async function installSupabaseStub(
  page: Page,
  opts: { signInError?: string | null; signUpError?: string | null; loggedIn?: boolean } = {}
) {
  await page.addInitScript((o) => {
    (window as any).__authCalls = [];
    const session = o.loggedIn ? { access_token: 'test-token', user: { id: 'test-user', email: 'user@example.com' } } : null;
    const mk = (errMsg: string | null | undefined) => async (creds: any) => {
      (window as any).__authCalls.push(creds);
      return { data: errMsg ? null : { user: { id: 'test-user' }, session: { access_token: 'x' } }, error: errMsg ? { message: errMsg } : null };
    };
    (window as any).supabaseClient = {
      auth: {
        signInWithPassword: mk(o.signInError),
        signUp: mk(o.signUpError),
        getSession: async () => ({ data: { session } }),
        getUser: async () => ({ data: { user: session ? session.user : null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
    };
  }, opts);
}

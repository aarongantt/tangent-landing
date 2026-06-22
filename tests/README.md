# Landing E2E (Playwright)

End-to-end tests for the TANGENT marketing/landing site. **No browser extension** here, so it runs **headless** and fast.

## Golden rule: nothing external is ever hit

The live site embeds a **`pk_live_` Stripe key + prod Supabase**. The `page` fixture in [fixtures.ts](fixtures.ts) routes `**/*` and **blocks every non-localhost request** — external scripts/styles are stubbed empty, XHR/fetch return `{}`. So no real user, charge, or subscription is ever created. SDK-dependent flows get explicit stubs:
- `installSupabaseStub(page, { signInError?, signUpError?, loggedIn? })` — fake `window.supabaseClient.auth`.
- `installStripeStub(page)` — fake `window.Stripe` (inert elements) + `window.supabase.createClient`.

## Run

```bash
npm ci
npx playwright install chromium     # first time
npm test                            # all specs, headless
npm run test:ui                     # interactive
```

A tiny concurrent node static server ([static-server.cjs](static-server.cjs)) serves the repo over `http://127.0.0.1:4321` (handles parallel workers + `/account`-style directory paths; `python -m http.server` is single-threaded and flaked under load).

## Specs (10 tests)

| File | Covers |
|------|--------|
| [smoke.spec.ts](smoke.spec.ts) | key marketing pages render with all external network blocked; signup renders the plan cards (`data-plan`) |
| [auth-modal.spec.ts](auth-modal.spec.ts) | `auth-modal.js`: empty-field validation, Supabase sign-in error surfaced, successful sign-in → redirect to `/account` |
| [checkout.spec.ts](checkout.spec.ts) | every paid plan → a **distinct** Stripe `price_…` id (parsed from source); clicking *pro_monthly* opens the payment modal and sends the **exact** price id to `/api/create-subscription` |

## CI

[.github/workflows/e2e.yml](../.github/workflows/e2e.yml) runs the suite headless on every push/PR and uploads the HTML report.

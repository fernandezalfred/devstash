# Stripe Integration Phase 1 — Core Infrastructure

## Overview

Lay the groundwork for DevStash Pro billing: install the Stripe SDK, add the lazy Stripe client, and build the pure usage-limits (quota/gating) module with unit tests. No webhooks, no Checkout/Portal, no UI — those are Phase 2. Nothing in this phase requires the Stripe CLI or a live Stripe account to verify; everything here is testable with `npm test`.

Full research/reference: `docs/stripe-integration-plan.md` (read before implementing — it has exact code, file paths, and rationale for every item below).

## Requirements

- Install the `stripe` npm package (server SDK only — no `@stripe/stripe-js`, hosted Checkout/Portal don't need it)
- Add a lazy Stripe client singleton, following the existing `src/lib/r2.ts` pattern (so `next build` still works with no `STRIPE_SECRET_KEY` set)
- Add price-id helpers for resolving monthly/yearly Stripe price ids from env vars, and the reverse lookup (price id → interval) for later webhook use
- Build a pure, DB-free usage-limits module covering:
  - Free-tier item quota (50 items)
  - Free-tier collection quota (3 collections)
  - Pro-only type gating (`file` / `image` system types)
- Add a DB-touching helper that loads a user's `isPro` flag + current item/collection counts in one call, for callers to pass into the pure checks
- Unit test the usage-limits module: Pro bypass, at-limit rejection, under-limit pass, and file/image rejection for free users (`src/lib` is in the Vitest scope per `context/coding-standards.md`)
- (Optional but recommended) Migration: add `stripePriceId String?` and `stripeCurrentPeriodEnd DateTime?` to `User` — see §4.1 of the research doc. Skippable for a true MVP; drive everything off `isPro` + `stripeCustomerId` + `stripeSubscriptionId` alone if skipped.
- Document the `.env`/`.env.example` Stripe vars are in place (they already are — `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`); fill `.env` with test-mode values

## Files to Create

- `src/lib/stripe.ts` — lazy `getStripe()` client, `priceIdFor(interval)`, `intervalForPriceId(priceId)` (see research doc §4.2)
- `src/lib/plan.ts` — the usage-limits/gating module: `FREE_ITEM_LIMIT`, `FREE_COLLECTION_LIMIT`, `PRO_ONLY_TYPES`, `checkItemQuota`, `checkCollectionQuota`, `checkTypeAllowed`, `getPlanContext(userId)` (see research doc §4.2)
- `src/lib/plan.test.ts` — unit tests for the above (see research doc §4.2, §4.5 automated checklist)

## Files to Modify

- `package.json` — `npm install stripe`
- `.env.example` — optionally group the `STRIPE_*` vars under a `# --- Billing (Stripe) ---` header with a one-line pointer to `docs/stripe-integration-plan.md`
- `prisma/schema.prisma` — only if doing the optional migration (§4.1); run `npm run db:migrate` + `npm run db:generate` (dev branch, never `db push`)

## Explicitly Out of Scope (Phase 2)

- Wiring the gates into `createItem` / `POST /api/upload` / `POST /api/collections` — deferred to Phase 2 since verifying a free user actually gets blocked, and a Pro user doesn't, needs a real Pro account produced via Checkout
- Webhook route, Checkout/Portal Server Actions, Billing UI, homepage pricing wiring

## Testing

**Automated only — no Stripe CLI needed for this phase:**

- [ ] `src/lib/plan.test.ts` passes — Pro bypass, at-limit, under-limit, file/image-for-free cases
- [ ] Full existing suite stays green (`npm test`)
- [ ] `npm run build` + `npm run lint` clean
- [ ] If the optional migration was done: `npx prisma migrate status` shows in sync

## References

- `docs/stripe-integration-plan.md` §1 (current state), §3.3 (lazy-client pattern), §4.1–§4.2, §4.5 (automated checklist), §4.6 steps 1–4

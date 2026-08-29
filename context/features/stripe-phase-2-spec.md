# Stripe Integration Phase 2 — Integration & UI

## Overview

Build on Phase 1's Stripe client + usage-limits module: wire the gates into the actual create paths, add the webhook that keeps `isPro` in sync with Stripe subscription status, add Checkout/Billing Portal Server Actions, and surface it all in the UI (Settings page, homepage pricing, upgrade affordances). Everything in this phase needs the Stripe CLI (`stripe listen`, `stripe trigger`) and/or a Stripe test-mode dashboard to verify end-to-end — that's what separates it from Phase 1.

Prerequisite: Phase 1 complete (`src/lib/stripe.ts`, `src/lib/plan.ts` + tests, `stripe` installed).

Full research/reference: `docs/stripe-integration-plan.md` (read before implementing — it has exact code, file paths, and rationale for every item below).

## Requirements

- **Feature gating enforcement** — wire Phase 1's `checkItemQuota` / `checkCollectionQuota` / `checkTypeAllowed` into the real create paths:
  - `createItem` Server Action (`src/actions/items.ts`) — item quota gate
  - `POST /api/upload` (`src/app/api/upload/route.ts`) — type gate (file/image → Pro-only) **and** item quota gate, checked before touching R2
  - `POST /api/collections` (`src/app/api/collections/route.ts`) — collection quota gate
- **Webhook** — `POST /api/stripe/webhook`, verifying signature against the raw request body, handling `checkout.session.completed`, `customer.subscription.created/updated/deleted`, syncing `isPro` / `stripeSubscriptionId` (+ `stripePriceId` / `stripeCurrentPeriodEnd` if the optional migration was done) keyed off `stripeCustomerId`. Must stay outside `src/proxy.ts`'s matcher (no auth gate — Stripe is the caller).
- **Checkout + Billing Portal** — Server Actions that create/reuse a Stripe customer, start a subscription Checkout session (monthly or yearly), and open the Billing Portal for existing subscribers. Checkout persists `stripeCustomerId` to the user row *before* redirecting, so a retried checkout can't create a duplicate customer.
- **Settings UI** — a new "Plan" section on `/settings` showing current plan (Free/Pro) and either Upgrade buttons ($8/mo, $72/yr) or a "Manage subscription" button, plus a toast/banner reading `?checkout=success` / `?checkout=cancelled` off the redirect.
- **Homepage pricing wiring** — `PricingCards`' Pro CTA calls Checkout (signed in) using its existing monthly/yearly toggle state, or routes to `/register` (signed out).
- Optional UX polish (do if time allows, not required): `UserMenu` upgrade affordance for Free users; Sidebar `files`/`images` rows link to `/settings` instead of `/items/files` for Free users; hide/disable file/image type options in `CreateItemDialog`/`TopBar` for Free users (server-side gate is authoritative either way).

## Files to Create

- `src/app/api/stripe/webhook/route.ts` — see research doc §4.2, §3.4 (webhook conventions — raw body, no `auth()`, idempotent upserts, 200 on unhandled event types)
- `src/actions/billing.ts` — `createCheckoutSession`, `createBillingPortalSession` (see research doc §4.2)
- `src/components/settings/BillingSection.tsx` — client component with the Upgrade/Manage buttons (see research doc §4.2)

## Files to Modify

- `src/actions/items.ts` (`createItem`) — add the item quota gate after the auth check
- `src/app/api/upload/route.ts` — add type + quota gates before the R2 upload
- `src/app/api/collections/route.ts` (`POST`) — add the collection quota gate
- `src/app/settings/page.tsx` — add the "Plan" section, read `?checkout=` search param
- `src/components/homepage/PricingCards.tsx` — wire the Pro CTA to `createCheckoutSession`
- `src/components/dashboard/UserMenu.tsx`, `src/components/dashboard/Sidebar.tsx`, `src/components/items/CreateItemDialog.tsx`, `TopBar.tsx` — optional UX polish (see Requirements)
- `src/lib/rate-limit.ts` — optional: add a `"checkout"` limiter entry if abuse protection on `createCheckoutSession` is wanted

## Stripe Dashboard Setup (prerequisite for testing this phase)

See research doc §4.4 in full. Summary:

1. Create the *DevStash Pro* product with two recurring prices ($8/mo, $72/yr) → copy ids into `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
2. Copy the test-mode Secret key → `STRIPE_SECRET_KEY`
3. Activate the Customer Billing Portal (allow cancel + payment method update)
4. Local dev: `stripe login`, then `stripe listen --forward-to localhost:3000/api/stripe/webhook`, copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`, restart `npm run dev`
5. Set `AUTH_URL` explicitly (needed for `success_url`/`cancel_url`/`return_url` — see research doc §5)

## Testing

**Automated:**

- [ ] Full suite stays green (`npm test`), including Phase 1's `plan.test.ts`
- [ ] `npm run build` + `npm run lint` clean

**Manual — requires `stripe listen` running (test mode):**

- [ ] Free user → `/settings` shows "Free plan" + Upgrade buttons
- [ ] Upgrade (monthly) → Stripe Checkout → pay with `4242 4242 4242 4242` → redirected to `/settings?checkout=success` → plan flips to Pro after the page load; repeat for yearly
- [ ] DB: `isPro`, `stripeCustomerId`, `stripeSubscriptionId` (+ `stripePriceId`/`stripeCurrentPeriodEnd` if migrated) populated correctly
- [ ] `stripe trigger checkout.session.completed` updates the row; replaying the same event (`stripe events resend <id>`) causes no duplicate side effects
- [ ] Billing Portal: cancel subscription → `customer.subscription.deleted` → `isPro` back to false; resubscribe → customer id reused, not duplicated
- [ ] Payment failure card `4000 0000 0000 0341` → subscription goes `past_due` → `isPro` stays/goes false
- [ ] Bad-signature webhook request (garbage body + fake `stripe-signature` header) → `400`, no DB change

**Manual — gating (verify both blocked-as-free and allowed-as-pro):**

- [ ] Free user at 50 items → `createItem` returns the quota error, UI shows an error toast
- [ ] Free user → `POST /api/upload` for file/image → `403` with the Pro message (via the create dialog and via curl)
- [ ] Free user at 3 collections → `POST /api/collections` → `403`
- [ ] Same three actions succeed once the account is Pro

**Manual — auth edge cases:**

- [ ] Signed-out user hitting `createCheckoutSession` → error, no redirect
- [ ] `/api/stripe/webhook` reachable with no session and confirmed **not** in `src/proxy.ts`'s matcher

## References

- `docs/stripe-integration-plan.md` §2 (gating analysis), §3.1–§3.4 (route/action/webhook conventions), §4.2–§4.4 (full code + dashboard setup), §4.5 (full manual checklist), §4.6 steps 5–10, §5 (key risks — customer-id uniqueness, access-until-period-end tradeoff, no `useSession()` needed)

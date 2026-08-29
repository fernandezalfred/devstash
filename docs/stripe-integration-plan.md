# Stripe Integration Plan — DevStash Pro

> Research doc produced by `/research stripe-integration-research`. Documentation only — no source changed.
> Target: subscription billing for **DevStash Pro** — $8/mo (monthly) and $72/yr (annual).

---

## 1. Current State Analysis

### 1.1 `User` model (`prisma/schema.prisma`)

The billing columns **already exist** — no schema work is strictly required for an MVP:

```prisma
// Pro / billing
isPro                Boolean @default(false)
stripeCustomerId     String? @unique
stripeSubscriptionId String? @unique
```

Gaps for a production-quality integration (recommended migration, see §4.1):

| Missing field | Why it helps |
| --- | --- |
| `stripePriceId String?` | Know whether the user is on monthly vs yearly without a round-trip to Stripe |
| `stripeCurrentPeriodEnd DateTime?` | Show "renews on / access until" in the UI; lets you keep access until period end after a cancel |

`emailVerified`, `passwordHash`, `editorPreferences` are unrelated. `Account` / `Session` / `VerificationToken` are NextAuth's — untouched.

### 1.2 Auth configuration & session handling

- **Split config** (`src/auth.config.ts` edge-safe providers only; `src/auth.ts` adds `PrismaAdapter`, real `authorize`, callbacks).
- **`session.strategy: "jwt"`** — no DB session rows are read on each request.
- JWT callbacks are minimal:
  ```ts
  jwt({ token, user }) { if (user) token.id = user.id; return token; }
  session({ session, token }) { if (token.id) session.user.id = token.id as string; return session; }
  ```
  **`isPro` is NOT in the token or the session object.** `src/types/next-auth.d.ts` only augments `session.user.id`.
- **There is no `<SessionProvider>` and no `useSession()` anywhere** in the app (`grep` confirms only `signIn`/`signOut` from `next-auth/react` are used). All plan-aware UI is server-rendered.

**Implication for the "session sync" note in the research prompt:**
The prompt's concern — a Stripe webhook writes `isPro` to the DB but the client session keeps a stale value — **does not currently apply**, because:

- `src/lib/db/users.ts` → `getCurrentUser()` and `getProfileUser()` **always re-read the authoritative row from the DB** (`prisma.user.findUnique … select: { isPro: true }`). The doc comment even says: *"so fields like `isPro` are fresh, not stale JWT claims"*.
- Every protected layout is `export const dynamic = "force-dynamic"` and calls `getCurrentUser()` (`dashboard/layout.tsx`, `items/layout.tsx`, `collections/layout.tsx`, plus `settings/page.tsx`, `profile/page.tsx`).

So after checkout: **webhook updates the DB → user lands back on the app → the next server render already shows Pro.** A plain full-page load (which the Stripe Checkout `success_url` redirect is) is sufficient. No JWT-callback change needed for v1.

Keep the prompt's workaround in your back pocket **only if** you later add client-side `useSession()` gating. If you do, add to `src/auth.ts`:

```ts
callbacks: {
  jwt({ token, user }) {
    if (user) token.id = user.id;
    return token;
  },
  session({ session, token }) {
    if (token.id) session.user.id = token.id as string;
    return session;
  },
}
// ...and augment src/types/next-auth.d.ts with `isPro: boolean` on Session["user"] + JWT.
```

…then have the webhook call NextAuth's `unstable_update` or simply rely on the token's short `maxAge`. **Prefer the current server-read approach; don't add per-request DB reads to the JWT callback unless forced.**

### 1.3 How user data is accessed in server code

- Server components / layouts → `getCurrentUser()` / `getProfileUser()` (`src/lib/db/users.ts`).
- Server Actions (`src/actions/items.ts`) → `const session = await auth(); if (!session?.user?.id) return { success: false, error: … }` then pass `session.user.id` to a `src/lib/db/*` query.
- API routes (`src/app/api/**`) → `const session = await auth(); if (!session?.user?.id) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })`.
- **`isPro` is only ever selected in `src/lib/db/users.ts`.** No create/mutation path currently loads it.

### 1.4 Existing subscription / payment code

**None.** What exists:

- `.env.example` **already declares** all five Stripe vars:
  ```
  STRIPE_SECRET_KEY=""
  STRIPE_PUBLISHABLE_KEY=""
  STRIPE_WEBHOOK_SECRET=""
  STRIPE_PRICE_ID_MONTHLY=""
  STRIPE_PRICE_ID_YEARLY=""
  ```
  (local `.env` needs real values; nothing reads these yet)
- `stripe` npm package is **not installed** (`package.json` has no Stripe dep). `@stripe/stripe-js` also absent.
- `context/project-overview.md` monetization section: *"During development, all users can access everything. The Pro gating foundation (flags, Stripe hooks) should still be wired up from day one."*
- `UserMenu.tsx` renders a display-only `PlanBadge` ("Pro"/"Free" pill) from `user.isPro`.
- `profile/page.tsx` shows `user.isPro ? "Pro plan" : "Free plan"`.

---

## 2. Feature Gating Analysis

### 2.1 Free-tier limits (from `context/project-overview.md`)

| Limit | Free | Pro |
| --- | --- | --- |
| Items (total) | **50** | Unlimited |
| Collections | **3** | Unlimited |
| System types | all **except** `file` / `image` | all |
| File / image uploads | ❌ | ✅ |
| AI features | ❌ | ✅ (not built yet) |
| Custom types | ❌ | ✅ (not built yet) |
| Export (JSON/ZIP) | ❌ | ✅ (not built yet) |
| Search | basic | basic (same) |

### 2.2 Where counts are / could be checked

**Nothing is enforced today.** Relevant counting code already exists and is the pattern to reuse:

- `src/lib/db/items.ts` → `getItemStats(userId)` = `prisma.item.count({ where: { userId } })` (+ favorites).
- `src/lib/db/collections.ts` → `getCollectionStats(userId)` = `prisma.collection.count({ where: { userId } })`.
- `src/lib/db/profile.ts` → `getProfileStats(userId)` (totals + per-type `groupBy`).

**Create paths that must gain a gate:**

| Path | File | Gate needed |
| --- | --- | --- |
| Create text item (snippet/prompt/command/note/link) | `createItem` action → `src/actions/items.ts` | item count < 50 (free) |
| Create file/image item | `POST /api/upload` → `src/app/api/upload/route.ts` → `createFileItem` | `isPro` required (type kind), **and** item count < 50 |
| Create collection | `POST /api/collections` → `src/app/api/collections/route.ts` → `createCollection` | collection count < 3 (free) |

Note: the file-upload feature **removed** the earlier `file`/`image` exclusion from `CreateItemDialog` / `TopBar` / `/items/[type]`, so file/image creation is currently open to everyone. Re-gate at the server (upload route) and optionally re-hide in the UI for free users.

### 2.3 Pro-only features & where they live

- **Type display gating already half-done:** `src/components/dashboard/Sidebar.tsx` has `const PRO_TYPE_SLUGS = new Set(["files", "images"])` and renders a gold "Pro" `ProTag` instead of a count for those rows — **cosmetic only**, no enforcement.
- AI / export / custom types: not implemented — when built, wrap the entry point in the same `requirePro()` helper (§4.2).

### 2.4 Settings page structure

`src/app/settings/page.tsx` — server component, `export const dynamic = "force-dynamic"`, `getProfileUser()` guard → `redirect("/sign-in")`, `max-w-2xl` container. Sections are:

```tsx
<section className="rounded-xl border border-border bg-card p-6">
  <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Account</h2>
  …
</section>
<EditorPreferencesProvider …><EditorPreferencesSection /></EditorPreferencesProvider>
```

**This is the home for a new "Billing" / "Plan" section** (see §4.4). `getProfileUser()` already returns `isPro`.
`UserMenu.tsx` dropdown links to `/settings` — no new nav entry required.

---

## 3. API & Webhook Patterns (conventions to follow)

### 3.1 API routes

- `src/app/api/<area>/route.ts` (or `[id]/route.ts`), named exports `GET` / `POST` / `PATCH` / `DELETE`.
- `import { NextResponse } from "next/server"`.
- Auth: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });`
- Body: `const body = await request.json().catch(() => null);` then Zod `safeParse` → `400` with `parsed.error.issues[0]?.message`.
- Dynamic params in Next 16: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params;`
- Response shape: `{ success: true, data } | { success: false, error }`, status `200`/`201`/`4xx`/`500`.
- `try/catch` around the DB call → generic `500` `{ success: false, error: "Could not … Please try again." }`.
- **`console.error` the real error server-side** (see `api/upload/route.ts`), return a generic message to the client.

### 3.2 Server Actions

- `src/actions/<area>.ts` with `"use server"` at the top. **Only async functions may be exported** from such a module (const arrays etc. must stay module-private — see the `CREATABLE_TYPES` comment in `items.ts`).
- Same `auth()` guard, returning `{ success: false, error }` instead of a `NextResponse`.
- Zod schema at module scope, `safeParse`, surface `parsed.error.issues[0]?.message`.
- Return type union: `{ success: true; data: T } | { success: false; error: string }`.
- A Server Action **may call `redirect()`** from `next/navigation` (useful for Checkout — the browser follows it).

### 3.3 Error-handling / env / lazy-client pattern

- Lazy singletons for external SDKs — copy `src/lib/r2.ts`:
  ```ts
  let client: Stripe | null = null;
  function getStripe(): Stripe {
    if (!client) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
      client = new Stripe(key, { apiVersion: "2025-…" });
    }
    return client;
  }
  ```
  This keeps `next build` working when env vars are absent (same reason `r2.ts` / `email.ts` do it).
- Feature flags: `src/lib/flags.ts` reads `process.env` per call, server-only. Add `isBillingEnabled()` here if you want a kill switch.
- Rate limiting: `src/lib/rate-limit.ts` → `checkRateLimit(name, id)`, `getClientIp(request)`, `tooManyRequests(reset)`. Named limiters live in `LIMITER_CONFIGS`. Fail-open when Upstash isn't configured. Add a `"checkout"` limiter if desired (optional for v1).

### 3.4 Webhook specifics (NOT like the other routes)

- **Raw body required**: `const payload = await request.text();` — do **not** `request.json()` first, signature verification needs the exact bytes.
- **No `auth()` guard** — Stripe is the caller. Verify instead with `stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!)`.
- Signature header: `request.headers.get("stripe-signature")`.
- **Path must not be under the proxy matcher.** `src/proxy.ts` currently matches `/dashboard`, `/items`, `/profile`, `/collections`, `/settings`, `/favorites` — `/api/stripe/webhook` is clear. Leave it that way.
- Return `200` quickly on success, `400` on a bad signature, `200` (not `500`) for an event type you don't handle so Stripe doesn't retry forever. `500` only for a genuine transient DB failure you *want* retried.
- Idempotency: dispatch on `event.type`; make every DB write an upsert / `updateMany where stripeCustomerId` so replays are harmless. (Optional hardening: a `ProcessedStripeEvent` table keyed by `event.id`.)

---

## 4. Implementation Plan

### 4.1 Migration (recommended, not strictly required)

Add to `model User` in `prisma/schema.prisma`:

```prisma
  stripePriceId          String?
  stripeCurrentPeriodEnd DateTime?
```

Then:

```bash
npm run db:migrate -- --name add_stripe_subscription_fields   # prisma migrate dev
npm run db:generate
```

(Prisma migrations run over `DIRECT_URL` via `prisma.config.ts`; app runtime uses pooled `DATABASE_URL`. Never `db push`.)
If you want to skip this for a true MVP, you can drive everything off `isPro` + `stripeCustomerId` + `stripeSubscriptionId` alone.

### 4.2 Files to CREATE

#### `src/lib/stripe.ts` — lazy Stripe client + shared constants

```ts
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { apiVersion: "2025-09-30.clover" }); // pin to whatever `stripe` ships
  }
  return client;
}

export type BillingInterval = "monthly" | "yearly";

export function priceIdFor(interval: BillingInterval): string {
  const id =
    interval === "yearly"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!id) throw new Error(`Missing Stripe price id for ${interval}`);
  return id;
}

// Reverse lookup for the webhook, so we can store which plan they're on.
export function intervalForPriceId(priceId: string | null | undefined): BillingInterval | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_YEARLY) return "yearly";
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_MONTHLY) return "monthly";
  return null;
}
```

#### `src/lib/plan.ts` — free-tier limits + gating helpers (PURE + testable)

```ts
import { prisma } from "@/lib/prisma";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
// System type slugs that require Pro regardless of counts.
export const PRO_ONLY_TYPES = new Set(["file", "image"]);

export type GateResult = { ok: true } | { ok: false; error: string };

// Pure — unit-test this directly (src/lib is in the Vitest scope).
export function checkItemQuota(isPro: boolean, currentCount: number): GateResult {
  if (isPro) return { ok: true };
  if (currentCount >= FREE_ITEM_LIMIT) {
    return { ok: false, error: `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited.` };
  }
  return { ok: true };
}

export function checkCollectionQuota(isPro: boolean, currentCount: number): GateResult {
  if (isPro) return { ok: true };
  if (currentCount >= FREE_COLLECTION_LIMIT) {
    return { ok: false, error: `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro.` };
  }
  return { ok: true };
}

export function checkTypeAllowed(isPro: boolean, typeName: string): GateResult {
  if (isPro || !PRO_ONLY_TYPES.has(typeName)) return { ok: true };
  return { ok: false, error: `${typeName} items are a Pro feature. Upgrade to Pro.` };
}

// DB-touching convenience used by the create paths.
export async function getPlanContext(userId: string) {
  const [user, itemCount, collectionCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } }),
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);
  return { isPro: user?.isPro ?? false, itemCount, collectionCount };
}
```

#### `src/actions/billing.ts` — Checkout + Billing Portal (Server Actions)

```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, priceIdFor } from "@/lib/stripe";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

const checkoutSchema = z.object({ interval: z.enum(["monthly", "yearly"]) });

export async function createCheckoutSession(input: { interval: "monthly" | "yearly" }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "You must be signed in." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid plan." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isPro: true, stripeCustomerId: true },
  });
  if (!user) return { success: false as const, error: "User not found." };
  if (user.isPro) return { success: false as const, error: "You are already on Pro." };

  const stripe = getStripe();

  // Reuse or create the Stripe customer, and persist the id immediately so the
  // webhook can always resolve customer -> user.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdFor(parsed.data.interval), quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${APP_URL}/settings?checkout=success`,
    cancel_url: `${APP_URL}/settings?checkout=cancelled`,
    // Belt-and-braces: also stamp userId on the subscription for the webhook.
    subscription_data: { metadata: { userId: user.id } },
    client_reference_id: user.id,
  });

  if (!checkout.url) return { success: false as const, error: "Could not start checkout." };
  redirect(checkout.url); // browser follows the 303 to Stripe Checkout
}

export async function createBillingPortalSession() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "You must be signed in." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) return { success: false as const, error: "No billing account yet." };

  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${APP_URL}/settings`,
  });
  redirect(portal.url);
}
```

#### `src/app/api/stripe/webhook/route.ts` — subscription lifecycle → DB

```ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe, intervalForPriceId } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const payload = await request.text(); // RAW body — required for verification
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription && s.customer) {
          const sub = await getStripe().subscriptions.retrieve(s.subscription as string);
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break; // ignore; return 200 so Stripe stops retrying
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 }); // Stripe will retry
  }

  return NextResponse.json({ received: true });
}

// Idempotent: keyed on stripeCustomerId, safe to replay.
async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id ?? null;
  const active = sub.status === "active" || sub.status === "trialing";

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      isPro: active,
      stripeSubscriptionId: active ? sub.id : null,
      stripePriceId: active ? priceId : null,               // needs §4.1 migration
      stripeCurrentPeriodEnd: sub.current_period_end        // needs §4.1 migration
        ? new Date(sub.current_period_end * 1000)
        : null,
    },
  });
  void intervalForPriceId; // use if you want to store "monthly"/"yearly" explicitly
}
```

> If you skip the §4.1 migration, drop the `stripePriceId` / `stripeCurrentPeriodEnd` lines.

#### `src/components/settings/BillingSection.tsx` — client component for the buttons

```tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createBillingPortalSession, createCheckoutSession } from "@/actions/billing";

export function BillingSection({ isPro }: { isPro: boolean }) {
  const [pending, start] = useTransition();

  if (isPro) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await createBillingPortalSession();
          if (res && !res.success) toast(res.error, "error"); // success path redirects
        })}
      >
        Manage subscription
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        disabled={pending}
        onClick={() => start(async () => {
          const res = await createCheckoutSession({ interval: "monthly" });
          if (res && !res.success) toast(res.error, "error");
        })}
      >
        Upgrade — $8/mo
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await createCheckoutSession({ interval: "yearly" });
          if (res && !res.success) toast(res.error, "error");
        })}
      >
        $72/yr
      </Button>
    </div>
  );
}
```

#### `src/lib/plan.test.ts` — Vitest (per `context/coding-standards.md`, `src/lib` is in scope)

Cover `checkItemQuota` / `checkCollectionQuota` / `checkTypeAllowed`: Pro bypass, at-limit rejection, under-limit pass, `file`/`image` rejection for free.

#### (Optional) `src/lib/flags.ts` addition — `isBillingEnabled()`

Kill switch so the Upgrade UI can be hidden if Stripe env vars aren't set.

### 4.3 Files to MODIFY

| File | Change |
| --- | --- |
| `package.json` | `npm install stripe` (server SDK only; hosted Checkout + Portal need **no** `@stripe/stripe-js`). |
| `prisma/schema.prisma` | Add `stripePriceId`, `stripeCurrentPeriodEnd` to `User` (§4.1). Run `db:migrate` + `db:generate`. |
| `.env` (local, gitignored) | Fill the five already-declared `STRIPE_*` vars with test-mode values. `.env.example` already documents them — add a one-line comment pointing at this doc. |
| `.env.example` | Optionally group the `STRIPE_*` block under a `# --- Billing (Stripe) ---` header with links, matching the file's existing style. |
| `src/actions/items.ts` → `createItem` | After the `auth()` guard: `const { isPro, itemCount } = await getPlanContext(session.user.id); const gate = checkItemQuota(isPro, itemCount); if (!gate.ok) return { success: false, error: gate.error };` |
| `src/app/api/upload/route.ts` | After auth + Zod parse: load `isPro` + item count; `checkTypeAllowed(isPro, type)` **and** `checkItemQuota(isPro, itemCount)` → `403` / `402` with the error message **before** touching R2. |
| `src/lib/db/items.ts` → `createFileItem` (defense in depth) | Optional: re-check quota inside the query too, since it's the shared choke point. |
| `src/app/api/collections/route.ts` → `POST` | After Zod parse: `const gate = checkCollectionQuota(isPro, collectionCount); if (!gate.ok) return NextResponse.json({ success:false, error: gate.error }, { status: 403 });` |
| `src/app/settings/page.tsx` | Add a "Plan" `<section>` (same `rounded-xl border border-border bg-card p-6` styling) rendering current plan + `<BillingSection isPro={user.isPro} />`. Read `?checkout=success` / `?cancelled` from `searchParams` to show a toast/banner. `getProfileUser()` already returns `isPro`. |
| `src/components/dashboard/UserMenu.tsx` | Optional: turn the `PlanBadge` into a `<Link href="/settings">` for Free users, or add an "Upgrade to Pro" `DropdownMenuItem`. |
| `src/components/homepage/PricingCards.tsx` | Wire the Pro CTA: signed-in → call `createCheckoutSession({ interval })` using the component's existing monthly/yearly toggle state; signed-out → `href="/register?next=/settings"`. (`src/app/page.tsx` already resolves `getCurrentUser()` and is `force-dynamic`, so pass `signedIn` down.) |
| `src/components/dashboard/Sidebar.tsx` | Optional: keep the `PRO_TYPE_SLUGS` "Pro" tag, but for free users make the `files`/`images` rows link to `/settings` instead of `/items/files`. |
| `src/components/items/CreateItemDialog.tsx` / `TopBar.tsx` | Optional UX: for free users hide/disable the `file`/`image` type options (server still enforces). |
| `src/types/next-auth.d.ts` | **Only if** you later add `useSession()` gating — add `isPro` to `Session["user"]` and `JWT`. Not needed for v1. |

### 4.4 Stripe Dashboard setup steps

1. **Create the Product**: Dashboard → Products → *DevStash Pro*.
2. **Add two recurring prices** on that product:
   - $8.00 USD / month → copy the `price_…` id → `STRIPE_PRICE_ID_MONTHLY`.
   - $72.00 USD / year → copy the `price_…` id → `STRIPE_PRICE_ID_YEARLY`.
3. **API keys**: Developers → API keys → copy the **test-mode** Secret key → `STRIPE_SECRET_KEY`; Publishable key → `STRIPE_PUBLISHABLE_KEY` (not actually needed for hosted checkout, but the var already exists).
4. **Customer Billing Portal**: Settings → Billing → Customer portal → activate; allow "cancel subscription" and "update payment method"; optionally allow plan switching between the two prices.
5. **Webhook endpoint** (do this once the route is deployed / or use the CLI for local, step below):
   - Developers → Webhooks → Add endpoint → URL `https://<your-domain>/api/stripe/webhook`.
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copy the **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.
6. **Local development** — Stripe CLI:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # copy the whsec_… it prints into .env as STRIPE_WEBHOOK_SECRET, restart `npm run dev`
   ```
7. (Optional) Promotion codes: Products → Coupons, and keep `allow_promotion_codes: true` in the Checkout session.

### 4.5 Testing checklist

**Automated (`npm test`):**
- [ ] `src/lib/plan.test.ts` — quota + type-gate pure functions (Pro bypass, at-limit, under-limit, file/image for free).
- [ ] Existing suite still green (`vitest run`).
- [ ] `npm run build` + `npm run lint` clean.

**Manual — happy path (test mode, Stripe CLI listening):**
- [ ] Free user → `/settings` shows "Free plan" + Upgrade buttons.
- [ ] Click "Upgrade — $8/mo" → redirected to Stripe Checkout with the monthly price.
- [ ] Pay with `4242 4242 4242 4242`, any future expiry / CVC / ZIP.
- [ ] Redirected to `/settings?checkout=success`; **after the page load** the plan shows "Pro" (server re-read), `UserMenu` badge flips to Pro.
- [ ] DB: `user.isPro = true`, `stripeCustomerId`, `stripeSubscriptionId` (+ `stripePriceId`, `stripeCurrentPeriodEnd`) populated.
- [ ] Repeat with the **yearly** button → yearly price id on the subscription.

**Manual — gating:**
- [ ] As a free user near the limit, seed 50 items → `createItem` returns the quota error; UI shows an error toast.
- [ ] Free user hitting `POST /api/upload` for a `file`/`image` → `403` with the Pro message (test via the create dialog and via curl).
- [ ] Free user with 3 collections → `POST /api/collections` → `403`.
- [ ] Same three actions succeed once `isPro = true`.

**Manual — lifecycle / webhook:**
- [ ] `stripe trigger checkout.session.completed` → row updated.
- [ ] In the Billing Portal, **cancel** the subscription → `customer.subscription.updated`/`deleted` → `isPro` back to `false`, `stripeSubscriptionId` cleared; app reverts to Free on next load.
- [ ] Resubscribe via Portal / new Checkout → `isPro` true again (customer id reused, not duplicated).
- [ ] Send a webhook with a bad signature (`curl` garbage + `stripe-signature: x`) → `400`, no DB change.
- [ ] Replay the same event twice (`stripe events resend <id>`) → no duplicate side effects.
- [ ] Payment failure card `4000 0000 0000 0341` → subscription `past_due` → `isPro` false (status not in active/trialing).

**Manual — auth edge cases:**
- [ ] Signed-out user hitting `createCheckoutSession` (e.g. stale tab) → error, no redirect.
- [ ] Deleted user with a live JWT → `prisma.user.findUnique` null → graceful error.
- [ ] `/api/stripe/webhook` is reachable without a session (not caught by `src/proxy.ts` matcher) — confirm it's **not** added to the matcher.

### 4.6 Recommended implementation order

1. `npm install stripe`; fill `.env`; `stripe listen` running.
2. (Optional) §4.1 migration — `stripePriceId`, `stripeCurrentPeriodEnd`.
3. `src/lib/stripe.ts` (lazy client + price helpers).
4. `src/lib/plan.ts` + `src/lib/plan.test.ts` (pure gating logic first — cheap, no Stripe needed).
5. Wire gates into `createItem` / `POST /api/upload` / `POST /api/collections`. Verify limits with `npm test` + manual.
6. `src/app/api/stripe/webhook/route.ts`; test with `stripe trigger` before any UI exists.
7. `src/actions/billing.ts` (checkout + portal).
8. `src/components/settings/BillingSection.tsx` + the "Plan" section in `src/app/settings/page.tsx`. Full happy-path test.
9. Homepage `PricingCards` CTA wiring; `UserMenu` upgrade affordance; optional Sidebar/CreateItemDialog free-user hints.
10. `npm run build && npm run lint && npm test`; deploy; create the **production** webhook endpoint + prod price ids; smoke-test in live mode with a real card + immediate refund, or keep prod in test mode until launch.

---

## 5. Key Risks & Notes

- **`stripeCustomerId` / `stripeSubscriptionId` are `@unique`.** The create-customer path must persist `stripeCustomerId` *before* Checkout completes (as in §4.2) so a webhook can always map customer → user, and so a retried checkout doesn't create a second customer.
- **`current_period_end` field name** shifted across Stripe API versions / it now lives on the subscription item in some versions — verify against the exact `stripe` package version you install (fetch current Stripe Node docs via Context7 before writing the webhook).
- **Access-until-period-end**: the plan above flips `isPro` off the moment status leaves `active/trialing`. If you want "keep Pro until the paid period ends", gate on `stripeCurrentPeriodEnd > now` instead of a raw boolean, and only hard-revoke on `subscription.deleted`.
- **No `SessionProvider` today** — don't introduce `useSession()` gating casually; it would force adding the provider and the JWT `isPro` sync (the research prompt's snippet). Server reads via `getCurrentUser()` are simpler and already fresh.
- **Webhook idempotency** is handled by upsert-style writes; add a processed-events table only if you see duplicate side effects (e.g. sending emails on upgrade).
- **Rate-limit** `createCheckoutSession` if abuse is a concern — the `src/lib/rate-limit.ts` infra is there; add a `"checkout"` entry to `LIMITER_CONFIGS`.
- **`AUTH_URL`** is currently optional/commented in `.env.example`; the billing actions need a reliable absolute base for `success_url` / `return_url`. Set it explicitly in every environment, or derive the origin from the request in an API-route variant.

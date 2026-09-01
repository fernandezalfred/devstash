import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Stripe → DB sync. Deliberately NOT under src/proxy.ts's matcher (no auth()
// gate — Stripe is the caller, verified instead via the signature below).

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Raw body — required for signature verification, so this must not be
  // request.json()'d first (that would consume/reformat the exact bytes).
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

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
          const sub = await getStripe().subscriptions.retrieve(
            typeof s.subscription === "string" ? s.subscription : s.subscription.id,
          );
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
        break; // Ignore; return 200 below so Stripe stops retrying.
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    // 500 so Stripe retries — this is a transient DB failure, not a bad event.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Idempotent: an upsert-style write keyed on stripeCustomerId, so replaying
// the same (or a later) event is always safe.
async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const active = sub.status === "active" || sub.status === "trialing";

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      isPro: active,
      stripeSubscriptionId: active ? sub.id : null,
      stripePriceId: active ? priceId : null,
      // `current_period_end` lives on the subscription item, not the
      // subscription itself, in the pinned API version ("2026-08-26.dahlia").
      stripeCurrentPeriodEnd:
        active && item ? new Date(item.current_period_end * 1000) : null,
    },
  });
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, priceIdFor, type BillingInterval } from "@/lib/stripe";

// Reliable absolute base for success_url/cancel_url/return_url — Checkout and
// the Billing Portal both need a full URL, not a relative path.
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

const checkoutSchema = z.object({ interval: z.enum(["monthly", "yearly"]) });

type ActionResult = { success: false; error: string };

// Start a subscription Checkout session for the signed-in user, reusing (or
// creating) their Stripe customer. Redirects on success — there's no success
// return value, since the browser follows the redirect to Stripe.
export async function createCheckoutSession(input: {
  interval: BillingInterval;
}): Promise<ActionResult | void> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid plan." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isPro: true, stripeCustomerId: true },
  });
  if (!user) {
    return { success: false, error: "User not found." };
  }
  if (user.isPro) {
    return { success: false, error: "You are already on Pro." };
  }

  const stripe = getStripe();

  // Resolve the checkout URL inside a try/catch (any Stripe/DB call here can
  // throw — network error, bad price id, etc.) but call redirect() outside
  // it, since redirect() works by throwing a special error that must not be
  // caught here.
  let checkoutUrl: string;
  try {
    // Reuse or create the Stripe customer, persisting the id immediately
    // (before Checkout completes) so a retried checkout can't create a
    // second customer and the webhook can always resolve customer -> user.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdFor(parsed.data.interval), quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${APP_URL}/settings?checkout=success`,
      cancel_url: `${APP_URL}/settings?checkout=cancelled`,
      subscription_data: { metadata: { userId: user.id } },
      client_reference_id: user.id,
    });

    if (!checkout.url) {
      return { success: false, error: "Could not start checkout." };
    }
    checkoutUrl = checkout.url;
  } catch (err) {
    console.error("Failed to start Stripe checkout:", err);
    return { success: false, error: "Could not start checkout. Please try again." };
  }

  redirect(checkoutUrl); // browser follows the redirect to Stripe Checkout
}

// Open the Billing Portal for an existing subscriber. Redirects on success.
export async function createBillingPortalSession(): Promise<
  ActionResult | void
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return { success: false, error: "No billing account yet." };
  }

  let portalUrl: string;
  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/settings`,
    });
    portalUrl = portal.url;
  } catch (err) {
    console.error("Failed to open the Stripe Billing Portal:", err);
    return { success: false, error: "Could not open billing settings. Please try again." };
  }

  redirect(portalUrl);
}

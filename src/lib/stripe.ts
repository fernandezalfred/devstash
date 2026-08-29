import Stripe from "stripe";

// Server-only — never import from client components (credentials live in env).

// Lazily construct the client so missing env vars don't break the build/import.
let client: Stripe | null = null;
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    // Pinned to the version this `stripe` package ships, rather than relying
    // on the library default drifting across upgrades.
    client = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
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

// Reverse lookup for the webhook, so we can store which plan a user is on.
export function intervalForPriceId(priceId: string | null | undefined): BillingInterval | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_YEARLY) return "yearly";
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_MONTHLY) return "monthly";
  return null;
}

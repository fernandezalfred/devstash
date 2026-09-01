import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBillingPortalSession, createCheckoutSession } from "@/actions/billing";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, priceIdFor } from "@/lib/stripe";

// Mock the auth + DB + Stripe SDK + next/navigation boundaries so the action's
// own logic (auth gate, Zod validation, customer reuse-vs-create, error
// handling) is what's under test — no real session, database, or Stripe call.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
  priceIdFor: vi.fn(),
}));
// redirect() normally throws a special Next.js error to abort rendering;
// mocked here as a plain function so success paths can be asserted on.
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockedAuth = vi.mocked(auth);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUpdate = vi.mocked(prisma.user.update);
const mockedGetStripe = vi.mocked(getStripe);
const mockedPriceIdFor = vi.mocked(priceIdFor);

const mockedCustomersCreate = vi.fn();
const mockedCheckoutSessionsCreate = vi.fn();
const mockedPortalSessionsCreate = vi.fn();

beforeEach(async () => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  mockedPriceIdFor.mockReturnValue("price_fake");
  mockedGetStripe.mockReturnValue({
    customers: { create: mockedCustomersCreate },
    checkout: { sessions: { create: mockedCheckoutSessionsCreate } },
    billingPortal: { sessions: { create: mockedPortalSessionsCreate } },
  } as never);
  mockedCustomersCreate.mockResolvedValue({ id: "cus_new" });
  mockedCheckoutSessionsCreate.mockResolvedValue({
    url: "https://checkout.stripe.com/session_abc",
  });
  mockedPortalSessionsCreate.mockResolvedValue({
    url: "https://billing.stripe.com/session_xyz",
  });
  const { redirect } = await import("next/navigation");
  vi.mocked(redirect).mockClear();
});

describe("createCheckoutSession", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await createCheckoutSession({ interval: "monthly" });
    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid interval", async () => {
    const result = await createCheckoutSession({ interval: "weekly" } as never);
    expect(result).toEqual({ success: false, error: "Invalid plan." });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("rejects when the user can't be found", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const result = await createCheckoutSession({ interval: "monthly" });
    expect(result).toEqual({ success: false, error: "User not found." });
  });

  it("rejects a user who is already Pro", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      isPro: true,
      stripeCustomerId: "cus_1",
    } as never);
    const result = await createCheckoutSession({ interval: "monthly" });
    expect(result).toEqual({ success: false, error: "You are already on Pro." });
    expect(mockedCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates and persists a new Stripe customer when the user has none", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      isPro: false,
      stripeCustomerId: null,
    } as never);

    const { redirect } = await import("next/navigation");
    await createCheckoutSession({ interval: "monthly" });

    expect(mockedCustomersCreate).toHaveBeenCalledWith({
      email: "a@b.com",
      metadata: { userId: "user-1" },
    });
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(mockedCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new", mode: "subscription" }),
    );
    expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.com/session_abc");
  });

  it("reuses an existing Stripe customer without creating a new one", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      isPro: false,
      stripeCustomerId: "cus_existing",
    } as never);

    await createCheckoutSession({ interval: "yearly" });

    expect(mockedCustomersCreate).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(mockedCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" }),
    );
    expect(mockedPriceIdFor).toHaveBeenCalledWith("yearly");
  });

  it("returns an error when Stripe returns no checkout URL", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      isPro: false,
      stripeCustomerId: "cus_existing",
    } as never);
    mockedCheckoutSessionsCreate.mockResolvedValue({ url: null });

    const { redirect } = await import("next/navigation");
    const result = await createCheckoutSession({ interval: "monthly" });

    expect(result).toEqual({ success: false, error: "Could not start checkout." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a friendly error and does not redirect when Stripe throws", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      isPro: false,
      stripeCustomerId: "cus_existing",
    } as never);
    mockedCheckoutSessionsCreate.mockRejectedValue(new Error("stripe down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { redirect } = await import("next/navigation");
    const result = await createCheckoutSession({ interval: "monthly" });
    consoleError.mockRestore();

    expect(result).toEqual({
      success: false,
      error: "Could not start checkout. Please try again.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("createBillingPortalSession", () => {
  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const result = await createBillingPortalSession();
    expect(result).toEqual({ success: false, error: "You must be signed in." });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a user with no billing account yet", async () => {
    mockedFindUnique.mockResolvedValue({ stripeCustomerId: null } as never);
    const result = await createBillingPortalSession();
    expect(result).toEqual({ success: false, error: "No billing account yet." });
    expect(mockedPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("opens the billing portal and redirects on success", async () => {
    mockedFindUnique.mockResolvedValue({ stripeCustomerId: "cus_1" } as never);
    const { redirect } = await import("next/navigation");

    await createBillingPortalSession();

    expect(mockedPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_1" }),
    );
    expect(redirect).toHaveBeenCalledWith("https://billing.stripe.com/session_xyz");
  });

  it("returns a friendly error and does not redirect when Stripe throws", async () => {
    mockedFindUnique.mockResolvedValue({ stripeCustomerId: "cus_1" } as never);
    mockedPortalSessionsCreate.mockRejectedValue(new Error("stripe down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { redirect } = await import("next/navigation");
    const result = await createBillingPortalSession();
    consoleError.mockRestore();

    expect(result).toEqual({
      success: false,
      error: "Could not open billing settings. Please try again.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

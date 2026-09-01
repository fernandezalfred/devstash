"use client";

import { useTransition } from "react";

import { createBillingPortalSession, createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

// Upgrade (Free) or "Manage subscription" (Pro) buttons. Both actions redirect
// on success (to Stripe Checkout / the Billing Portal), so there's nothing to
// do here on success — only a failed action returns a result to toast.
export function BillingSection({ isPro }: { isPro: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isPro) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createBillingPortalSession();
            if (res && !res.success) toast(res.error, "error");
          })
        }
      >
        Manage subscription
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createCheckoutSession({ interval: "monthly" });
            if (res && !res.success) toast(res.error, "error");
          })
        }
      >
        Upgrade — $8/mo
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createCheckoutSession({ interval: "yearly" });
            if (res && !res.success) toast(res.error, "error");
          })
        }
      >
        $72/yr
      </Button>
    </div>
  );
}

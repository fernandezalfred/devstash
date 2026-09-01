"use client";

import { useEffect } from "react";

import { toast } from "@/components/ui/toast";

// Fires a toast for the ?checkout=success/cancelled redirect off Stripe
// Checkout. Renders nothing — a pure side-effect component, since toast() is
// a plain pub/sub call rather than something that needs to render UI itself.
export function CheckoutStatusToast({
  status,
}: {
  status: "success" | "cancelled" | null;
}) {
  useEffect(() => {
    if (status === "success") {
      toast("You're now on Pro. Welcome!");
    } else if (status === "cancelled") {
      toast("Checkout cancelled.", "error");
    }
  }, [status]);

  return null;
}

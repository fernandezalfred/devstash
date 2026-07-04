"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

// When `email` is provided (e.g. right after registering) the form is just a
// resend button. Otherwise it asks for the email first (used on the
// invalid/expired verification page where we don't know the address).
export function ResendVerificationForm({ email: presetEmail }: { email?: string }) {
  const [email, setEmail] = useState(presetEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend(address: string) {
    setLoading(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address }),
    }).catch(() => null);
    setLoading(false);

    if (res && res.status === 429) {
      const data = await res.json().catch(() => null);
      toast(
        data?.error ?? "Too many attempts. Please try again later.",
        "error",
      );
      return;
    }

    // Generic confirmation regardless of whether the email exists.
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        If an account with that email needs verifying, a new link is on its way.
      </p>
    );
  }

  if (presetEmail) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => resend(presetEmail)}
      >
        {loading ? "Sending…" : "Resend verification email"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        resend(email);
      }}
      className="space-y-3 text-left"
    >
      <div className="space-y-1.5">
        <label htmlFor="resend-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="resend-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteAccountDialog({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Require an exact email match before the destructive action is enabled.
  const canDelete = !!email && confirmText.trim() === email;

  async function onDelete() {
    if (!canDelete) return;
    setError(null);
    setLoading(true);

    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }

    // Clear the (now-stale) session and leave the protected area.
    toast("Your account has been deleted.");
    await signOut({ callbackUrl: "/sign-in" });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setConfirmText("");
          setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogTitle>Delete account</AlertDialogTitle>
        <AlertDialogDescription className="mt-2">
          This permanently deletes your account along with all of your items and
          collections. This action cannot be undone.
        </AlertDialogDescription>

        <div className="mt-4 space-y-1.5">
          <label htmlFor="confirmDelete" className="text-sm font-medium">
            Type <span className="font-mono text-foreground">{email}</span> to
            confirm
          </label>
          <Input
            id="confirmDelete"
            autoComplete="off"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!canDelete || loading}
            onClick={onDelete}
          >
            {loading ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

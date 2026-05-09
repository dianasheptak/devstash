"use client";

import { useEffect, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
};

export function DeleteAccountDialog({ open, onOpenChange, email }: Props) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setConfirm("");
    setError(null);
  }, [open]);

  const matches = confirm.trim().toLowerCase() === email.trim().toLowerCase();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!matches) {
      const msg = "Type your email to confirm";
      setError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Could not delete account";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Account deleted");
      await signOut({ callbackUrl: "/sign-in" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-destructive">Delete account</DialogTitle>
          </div>
          <DialogDescription>
            This permanently deletes your account, all items, and all collections.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="confirm-email" className="text-sm font-medium">
              Type <span className="font-mono text-foreground">{email}</span> to confirm
            </label>
            <Input
              id="confirm-email"
              type="text"
              autoComplete="off"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !matches}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete my account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

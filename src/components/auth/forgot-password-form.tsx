"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const msg = "Invalid email address";
      setError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Could not send reset email";
        setError(message);
        toast.error(message);
        return;
      }

      setSubmitted(true);
      toast.success("If an account exists for that email, a reset link is on its way");
    });
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          If an account exists for <span className="text-foreground font-medium">{email}</span>, we&apos;ve sent a password reset link. The link expires in 1 hour.
        </p>
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-foreground font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Send reset link
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

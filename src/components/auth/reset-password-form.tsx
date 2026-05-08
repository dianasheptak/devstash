"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (passwordRef.current) passwordRef.current.value = "";
      if (confirmRef.current) confirmRef.current.value = "";
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">This reset link is missing a token.</p>
        <p className="text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-foreground font-medium hover:underline">
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  function validate(): string | null {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error ?? "Could not reset password";
        setError(message);
        toast.error(message);
        if (data?.reason === "expired" || data?.reason === "invalid") {
          router.push(`/sign-in?reset=${data.reason}`);
        }
        return;
      }

      router.push("/sign-in?reset=success");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" autoComplete="off">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <Input
          ref={passwordRef}
          id="password"
          name="reset-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <Input
          ref={confirmRef}
          id="confirmPassword"
          name="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        Reset password
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        <Link href="/sign-in" className="text-foreground font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function VerifyEmailCard() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [isPending, startTransition] = useTransition();
  const [sentOnce, setSentOnce] = useState(false);

  function handleResend() {
    if (!email) {
      toast.error("Missing email — go back and register again");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Could not send verification email");
        return;
      }
      setSentOnce(true);
      toast.success("Verification email sent");
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
          <Mail className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-foreground">{email}</span>
            ) : (
              <span>your inbox</span>
            )}
            . Click the link in the email to activate your account.
          </p>
        </div>

        <div className="w-full space-y-2 pt-2">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder, or resend below.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {sentOnce ? "Send another link" : "Resend verification email"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground pt-2">
          Already verified?{" "}
          <Link href="/sign-in" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

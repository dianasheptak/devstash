"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type Interval = "monthly" | "yearly";

const PRICES: Record<Interval, { amount: string; suffix: string; note: string }> = {
  monthly: { amount: "$8", suffix: "/mo", note: "Billed monthly. Cancel anytime." },
  yearly: { amount: "$72", suffix: "/yr", note: "Save 25% — 2 months free." },
};

export function UpgradeCard() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [pending, startTransition] = useTransition();

  function onUpgrade() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interval }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? "Failed to start checkout");
          return;
        }
        window.location.href = data.url;
      } catch {
        toast.error("Failed to start checkout");
      }
    });
  }

  const price = PRICES[interval];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Upgrade to Pro
            </CardTitle>
            <CardDescription className="mt-1">
              Unlimited items & collections, files & images, and AI features.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="inline-flex rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-medium transition ${
              interval === "monthly"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-medium transition ${
              interval === "yearly"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
          </button>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{price.amount}</span>
          <span className="text-sm text-muted-foreground">{price.suffix}</span>
        </div>
        <p className="text-xs text-muted-foreground">{price.note}</p>

        <Button
          onClick={onUpgrade}
          disabled={pending}
          className="w-full cursor-pointer"
        >
          {pending ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </CardContent>
    </Card>
  );
}

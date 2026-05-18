"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Interval = "monthly" | "yearly";

const FREE_FEATURES: { included: boolean; label: string }[] = [
  { included: true, label: "50 items total" },
  { included: true, label: "3 collections" },
  { included: true, label: "Snippets, Prompts, Commands, Notes, Links" },
  { included: true, label: "Basic search" },
  { included: false, label: "File & Image uploads" },
  { included: false, label: "AI features" },
  { included: false, label: "Data export" },
];

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "All item types incl. Files & Images",
  "Powerful search",
  "File & Image uploads",
  "AI auto-tagging & summaries",
  "Data export (JSON / ZIP)",
];

export function PricingCards() {
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

  const proAmount = interval === "monthly" ? "$8" : "$72";
  const proPeriod = interval === "monthly" ? "/month" : "/year";
  const proSubtext =
    interval === "monthly"
      ? "Billed monthly. Cancel anytime."
      : "Billed yearly. Save 25% — 2 months free.";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          className={cn(
            "cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition",
            interval === "monthly"
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval("yearly")}
          className={cn(
            "cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition flex items-center gap-2",
            interval === "yearly"
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Yearly
          <Badge variant="secondary" className="text-[10px] py-0">
            Save 25%
          </Badge>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Everything you need to get started.
            </p>
          </div>
          <ul className="my-6 space-y-3 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-sm">
                {f.included ? (
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <X className="size-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                )}
                <span className={f.included ? "" : "text-muted-foreground"}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="outline" disabled className="w-full">
            Current plan
          </Button>
        </div>

        {/* Pro */}
        <div className="relative rounded-xl border border-primary/40 bg-card p-6 sm:p-8 flex flex-col ring-1 ring-primary/20">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
            Most Popular
          </span>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">{proAmount}</span>
              <span className="text-sm text-muted-foreground">{proPeriod}</span>
            </div>
            <p className="text-sm text-muted-foreground">{proSubtext}</p>
          </div>
          <ul className="my-6 space-y-3 flex-1">
            {PRO_FEATURES.map((label) => (
              <li key={label} className="flex items-start gap-2 text-sm">
                <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={onUpgrade}
            disabled={pending}
            className="w-full cursor-pointer"
          >
            {pending ? "Redirecting…" : "Upgrade to Pro"}
          </Button>
        </div>
      </div>
    </div>
  );
}

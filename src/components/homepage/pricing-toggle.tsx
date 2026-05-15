"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FREE_FEATURES = [
  { included: true, text: "50 items total" },
  { included: true, text: "3 collections" },
  { included: true, text: "Snippets, Prompts, Commands, Notes, Links" },
  { included: true, text: "Basic search" },
  { included: false, text: "File & Image uploads" },
  { included: false, text: "AI features" },
  { included: false, text: "Data export" },
];

const PRO_FEATURES = [
  { included: true, text: "Unlimited items" },
  { included: true, text: "Unlimited collections" },
  { included: true, text: "All item types incl. Files & Images" },
  { included: true, text: "Powerful search" },
  { included: true, text: "File & Image uploads" },
  { included: true, text: "AI auto-tagging & summaries" },
  { included: true, text: "Data export (JSON / ZIP)" },
];

export function PricingToggle() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={cn("text-sm", !yearly ? "text-foreground" : "text-muted-foreground")}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={yearly}
          onClick={() => setYearly((y) => !y)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors border border-white/20",
            yearly ? "bg-blue-600" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white shadow transition-transform",
              yearly ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <span className={cn("text-sm flex items-center gap-2", yearly ? "text-foreground" : "text-muted-foreground")}>
          Yearly
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-green-400 bg-green-400/10 border-green-400/20">
            Save 25%
          </Badge>
        </span>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-2">Free</h3>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Everything you need to get started.</p>
          <ul className="space-y-2.5 mb-8 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                <span className={f.included ? "text-green-400" : "text-muted-foreground/40"}>
                  {f.included ? "✓" : "✗"}
                </span>
                <span className={f.included ? "text-foreground" : "text-muted-foreground/60"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-center h-10"
            )}
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro */}
        <div className="relative rounded-xl border border-blue-500/40 bg-blue-600/5 p-8 flex flex-col shadow-[0_0_32px_rgba(59,130,246,0.12)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-blue-600 text-white border-0 text-xs px-3">
              Most Popular
            </Badge>
          </div>
          <h3 className="text-xl font-bold mb-2">Pro</h3>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-bold">{yearly ? "$72" : "$8"}</span>
            <span className="text-muted-foreground">{yearly ? "/year" : "/month"}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {yearly ? "Billed annually — 2 months free." : "Billed monthly. Cancel anytime."}
          </p>
          <ul className="space-y-2.5 mb-8 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "default" }),
              "w-full justify-center h-10 bg-blue-600 hover:bg-blue-700 text-white border-0"
            )}
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
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
import { Badge } from "@/components/ui/badge";

type Props = {
  status: string | null;
  interval: "monthly" | "yearly" | null;
  periodEnd: Date | null;
  cancelAt: Date | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function ManageSubscriptionCard({ status, interval, periodEnd, cancelAt }: Props) {
  const [pending, startTransition] = useTransition();

  function onManage() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? "Failed to open billing portal");
          return;
        }
        window.location.href = data.url;
      } catch {
        toast.error("Failed to open billing portal");
      }
    });
  }

  const plan =
    interval === "monthly" ? "Monthly" : interval === "yearly" ? "Yearly" : "Pro";
  const renewLine =
    cancelAt
      ? `Cancels on ${dateFormatter.format(cancelAt)}`
      : periodEnd
      ? `Renews on ${dateFormatter.format(periodEnd)}`
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              DevStash Pro
            </CardTitle>
            <CardDescription className="mt-1">
              Plan: {plan}
            </CardDescription>
          </div>
          {status && (
            <Badge variant={cancelAt ? "outline" : "secondary"} className="capitalize">
              {cancelAt ? "Cancels soon" : status.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renewLine && (
          <p className="text-sm text-muted-foreground">{renewLine}</p>
        )}
        <Button
          variant="outline"
          onClick={onManage}
          disabled={pending}
          className="w-full cursor-pointer"
        >
          {pending ? "Opening…" : "Manage billing"}
        </Button>
      </CardContent>
    </Card>
  );
}

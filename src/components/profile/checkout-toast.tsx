"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CheckoutToast() {
  const params = useSearchParams();
  const status = params.get("checkout");

  useEffect(() => {
    if (status === "success") {
      toast.success("Welcome to Pro!", {
        id: "checkout",
        description: "Your subscription is active.",
      });
    } else if (status === "cancel") {
      toast("Checkout canceled", {
        id: "checkout",
        description: "No charge was made.",
      });
    }
  }, [status]);

  return null;
}

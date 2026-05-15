import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  _stripe = new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});

export type BillingInterval = "monthly" | "yearly";

export function priceIdFor(interval: BillingInterval): string {
  const id =
    interval === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;
  if (!id) {
    throw new Error(
      `Missing Stripe price ID for ${interval} (STRIPE_PRICE_ID_${interval.toUpperCase()})`
    );
  }
  return id;
}

export function intervalForPriceId(priceId: string): BillingInterval | null {
  if (priceId === process.env.STRIPE_PRICE_ID_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_ID_YEARLY) return "yearly";
  return null;
}

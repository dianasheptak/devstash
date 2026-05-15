import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

function toCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (typeof customer === "string") return customer;
  if (customer && typeof customer === "object" && "id" in customer) return customer.id;
  return null;
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = toCustomerId(subscription.customer);
  if (!customerId) {
    console.warn("[stripe] subscription has no customer id", subscription.id);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) {
    console.warn(
      `[stripe] no user matches stripeCustomerId ${customerId} (sub ${subscription.id})`
    );
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;
  const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: ACTIVE_STATUSES.has(subscription.status),
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPriceId: priceId,
      subscriptionPeriodEnd: periodEnd,
      subscriptionCancelAt: cancelAt,
    },
  });
}

export async function clearSubscription(customerId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) {
    console.warn(`[stripe] clearSubscription: no user for customer ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: false,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPriceId: null,
      subscriptionPeriodEnd: null,
      subscriptionCancelAt: null,
    },
  });
}

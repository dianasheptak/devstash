import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, priceIdFor, type BillingInterval } from "@/lib/stripe";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { interval?: string };
  const interval: BillingInterval =
    body.interval === "yearly" ? "yearly" : "monthly";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, isPro: true, stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.isPro) {
    return NextResponse.json(
      { error: "You're already on Pro." },
      { status: 400 }
    );
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdFor(interval), quantity: 1 }],
    success_url: `${appUrl()}/profile?checkout=success`,
    cancel_url: `${appUrl()}/profile?checkout=cancel`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: checkout.url });
}

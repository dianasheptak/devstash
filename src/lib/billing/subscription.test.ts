import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { syncSubscriptionFromStripe, clearSubscription } from "./subscription";
import { prisma } from "@/lib/prisma";

const mockFind = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.user.update as unknown as ReturnType<typeof vi.fn>;

function makeSub(overrides: Partial<{
  id: string;
  customer: string;
  status: string;
  cancel_at: number | null;
  priceId: string;
  periodEnd: number;
}> = {}): never {
  const sub = {
    id: overrides.id ?? "sub_123",
    customer: overrides.customer ?? "cus_123",
    status: overrides.status ?? "active",
    cancel_at: overrides.cancel_at ?? null,
    items: {
      data: [
        {
          price: { id: overrides.priceId ?? "price_monthly" },
          current_period_end: overrides.periodEnd ?? 1_800_000_000,
        },
      ],
    },
  };
  return sub as never;
}

describe("syncSubscriptionFromStripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets isPro: true for active subscription and populates fields", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    await syncSubscriptionFromStripe(makeSub({ status: "active" }));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({
        isPro: true,
        stripeSubscriptionId: "sub_123",
        subscriptionStatus: "active",
        subscriptionPriceId: "price_monthly",
      }),
    });
    const data = mockUpdate.mock.calls[0][0].data;
    expect(data.subscriptionPeriodEnd).toBeInstanceOf(Date);
    expect(data.subscriptionCancelAt).toBeNull();
  });

  it("sets isPro: true for trialing subscriptions", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    await syncSubscriptionFromStripe(makeSub({ status: "trialing" }));
    expect(mockUpdate.mock.calls[0][0].data.isPro).toBe(true);
  });

  it("sets isPro: false for canceled subscription", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    await syncSubscriptionFromStripe(makeSub({ status: "canceled" }));
    expect(mockUpdate.mock.calls[0][0].data.isPro).toBe(false);
  });

  it("sets isPro: false for past_due", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    await syncSubscriptionFromStripe(makeSub({ status: "past_due" }));
    expect(mockUpdate.mock.calls[0][0].data.isPro).toBe(false);
  });

  it("populates subscriptionCancelAt when cancel_at is set", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    await syncSubscriptionFromStripe(makeSub({ cancel_at: 1_900_000_000 }));
    const data = mockUpdate.mock.calls[0][0].data;
    expect(data.subscriptionCancelAt).toBeInstanceOf(Date);
    expect((data.subscriptionCancelAt as Date).getTime()).toBe(1_900_000_000 * 1000);
  });

  it("does not write when stripeCustomerId is unknown", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFind.mockResolvedValue(null);
    await syncSubscriptionFromStripe(makeSub({ customer: "cus_missing" }));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("clearSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("zeros out subscription fields for the matching user", async () => {
    mockFind.mockResolvedValue({ id: "u1" });
    await clearSubscription("cus_123");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        isPro: false,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPriceId: null,
        subscriptionPeriodEnd: null,
        subscriptionCancelAt: null,
      },
    });
  });

  it("does nothing when no user matches", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFind.mockResolvedValue(null);
    await clearSubscription("cus_missing");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

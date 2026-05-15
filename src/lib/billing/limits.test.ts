import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}));

import {
  canCreateItem,
  canCreateCollection,
  isProType,
  FREE_LIMITS,
} from "./limits";
import { prisma } from "@/lib/prisma";

const mockUserFind = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockItemCount = prisma.item.count as unknown as ReturnType<typeof vi.fn>;
const mockCollectionCount = prisma.collection.count as unknown as ReturnType<typeof vi.fn>;

describe("isProType", () => {
  it("returns true for file and image", () => {
    expect(isProType("file")).toBe(true);
    expect(isProType("image")).toBe(true);
  });

  it("returns false for non-Pro types", () => {
    expect(isProType("snippet")).toBe(false);
    expect(isProType("prompt")).toBe(false);
    expect(isProType("command")).toBe(false);
    expect(isProType("note")).toBe(false);
    expect(isProType("link")).toBe(false);
    expect(isProType("anything")).toBe(false);
  });
});

describe("canCreateItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Pro users without counting", async () => {
    mockUserFind.mockResolvedValue({ isPro: true });
    const result = await canCreateItem("u1");
    expect(result).toEqual({ allowed: true });
    expect(mockItemCount).not.toHaveBeenCalled();
  });

  it("allows free users under the limit", async () => {
    mockUserFind.mockResolvedValue({ isPro: false });
    mockItemCount.mockResolvedValue(FREE_LIMITS.items - 1);
    const result = await canCreateItem("u1");
    expect(result).toEqual({ allowed: true });
  });

  it("blocks free users at the limit with a reason", async () => {
    mockUserFind.mockResolvedValue({ isPro: false });
    mockItemCount.mockResolvedValue(FREE_LIMITS.items);
    const result = await canCreateItem("u1");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/50 items/);
      expect(result.reason).toMatch(/Pro/);
    }
  });
});

describe("canCreateCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Pro users without counting", async () => {
    mockUserFind.mockResolvedValue({ isPro: true });
    const result = await canCreateCollection("u1");
    expect(result).toEqual({ allowed: true });
    expect(mockCollectionCount).not.toHaveBeenCalled();
  });

  it("allows free users under the limit", async () => {
    mockUserFind.mockResolvedValue({ isPro: false });
    mockCollectionCount.mockResolvedValue(FREE_LIMITS.collections - 1);
    const result = await canCreateCollection("u1");
    expect(result).toEqual({ allowed: true });
  });

  it("blocks free users at the limit with a reason", async () => {
    mockUserFind.mockResolvedValue({ isPro: false });
    mockCollectionCount.mockResolvedValue(FREE_LIMITS.collections);
    const result = await canCreateCollection("u1");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/3 collections/);
      expect(result.reason).toMatch(/Pro/);
    }
  });
});

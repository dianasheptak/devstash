import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const VERIFICATION_TOKEN_TTL_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(email: string): Promise<{ rawToken: string; expires: Date }> {
  const identifier = email.trim().toLowerCase();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });

  return { rawToken, expires };
}

export type ConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

export async function consumeVerificationToken(rawToken: string): Promise<ConsumeResult> {
  if (!rawToken || typeof rawToken !== "string") {
    return { ok: false, reason: "invalid" };
  }

  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });

  if (!record) return { ok: false, reason: "invalid" };

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  if (record.expires < new Date()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, email: record.identifier };
}

export async function canResendVerification(email: string): Promise<boolean> {
  const identifier = email.trim().toLowerCase();
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: "desc" },
  });
  if (!existing) return true;
  const issuedAt = new Date(existing.expires.getTime() - VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const ageSeconds = (Date.now() - issuedAt.getTime()) / 1000;
  return ageSeconds >= RESEND_COOLDOWN_SECONDS;
}

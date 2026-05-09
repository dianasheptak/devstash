import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;
const RESEND_COOLDOWN_SECONDS = 60;
export const PASSWORD_RESET_IDENTIFIER_PREFIX = "pwreset:";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function prefixedIdentifier(email: string): string {
  return `${PASSWORD_RESET_IDENTIFIER_PREFIX}${email.trim().toLowerCase()}`;
}

export async function createPasswordResetToken(email: string): Promise<{ rawToken: string; expires: Date }> {
  const identifier = prefixedIdentifier(email);
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });

  return { rawToken, expires };
}

export type ConsumePasswordResetResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

export async function consumePasswordResetToken(rawToken: string): Promise<ConsumePasswordResetResult> {
  if (!rawToken || typeof rawToken !== "string") {
    return { ok: false, reason: "invalid" };
  }

  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });

  if (!record || !record.identifier.startsWith(PASSWORD_RESET_IDENTIFIER_PREFIX)) {
    return { ok: false, reason: "invalid" };
  }

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  if (record.expires < new Date()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, email: record.identifier.slice(PASSWORD_RESET_IDENTIFIER_PREFIX.length) };
}

export async function canResendPasswordReset(email: string): Promise<boolean> {
  const identifier = prefixedIdentifier(email);
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: "desc" },
  });
  if (!existing) return true;
  const issuedAt = new Date(existing.expires.getTime() - PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const ageSeconds = (Date.now() - issuedAt.getTime()) / 1000;
  return ageSeconds >= RESEND_COOLDOWN_SECONDS;
}

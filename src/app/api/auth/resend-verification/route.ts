import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canResendVerification, createVerificationToken } from "@/lib/auth/verification-token";
import { sendVerificationEmail } from "@/lib/email/resend";
import { isEmailVerificationEnabled } from "@/lib/config";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rate-limit";

const GENERIC_OK = { ok: true } as const;

export async function POST(req: Request) {
  let payload: { email?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit("resendVerification", `${ip}:${email}`);
  if (!rl.success) {
    return rateLimitedResponse(rl, "requests");
  }

  if (!isEmailVerificationEnabled()) {
    return NextResponse.json(GENERIC_OK);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    return NextResponse.json(GENERIC_OK);
  }

  const allowed = await canResendVerification(email);
  if (!allowed) {
    return NextResponse.json(
      { error: "Please wait a minute before requesting another verification email" },
      { status: 429 },
    );
  }

  try {
    const { rawToken } = await createVerificationToken(email);
    await sendVerificationEmail({ to: email, token: rawToken, name: user.name });
  } catch (err) {
    console.error("[resend-verification] failed to send email", err);
    return NextResponse.json({ error: "Could not send verification email" }, { status: 500 });
  }

  return NextResponse.json(GENERIC_OK);
}

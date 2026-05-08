import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canResendPasswordReset, createPasswordResetToken } from "@/lib/auth/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email/resend";

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

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return NextResponse.json(GENERIC_OK);
  }

  const allowed = await canResendPasswordReset(email);
  if (!allowed) {
    return NextResponse.json(
      { error: "Please wait a minute before requesting another reset email" },
      { status: 429 },
    );
  }

  try {
    const { rawToken } = await createPasswordResetToken(email);
    await sendPasswordResetEmail({ to: email, token: rawToken, name: user.name });
  } catch (err) {
    console.error("[forgot-password] failed to send email", err);
    return NextResponse.json({ error: "Could not send reset email" }, { status: 500 });
  }

  return NextResponse.json(GENERIC_OK);
}

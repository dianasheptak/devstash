import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/auth/password-reset-token";

type ResetPayload = {
  token?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

export async function POST(req: Request) {
  let payload: ResetPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = typeof payload.token === "string" ? payload.token : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const confirmPassword = typeof payload.confirmPassword === "string" ? payload.confirmPassword : "";

  if (!token) {
    return NextResponse.json({ error: "Reset token is missing", reason: "invalid" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const result = await consumePasswordResetToken(token);
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This reset link has expired — request a new one"
        : "This reset link is invalid or has already been used";
    return NextResponse.json({ error: message, reason: result.reason }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: result.email } });
  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has already been used", reason: "invalid" },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true });
}

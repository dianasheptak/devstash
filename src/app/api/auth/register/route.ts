import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { canResendVerification, createVerificationToken } from "@/lib/auth/verification-token";
import { sendVerificationEmail } from "@/lib/email/resend";
import { isEmailVerificationEnabled } from "@/lib/config";

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

export async function POST(req: Request) {
  let payload: RegisterPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const confirmPassword = typeof payload.confirmPassword === "string" ? payload.confirmPassword : "";

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const verificationRequired = isEmailVerificationEnabled();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Don't reveal that an account with this email exists. Return the same
    // generic success shape as the create-new path — users who own the address
    // already know to sign in or use forgot-password from the next screen.
    return NextResponse.json({ verificationRequired }, { status: 201 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: verificationRequired ? null : new Date(),
    },
    select: { id: true, email: true, name: true },
  });

  if (verificationRequired && (await canResendVerification(user.email))) {
    try {
      const { rawToken } = await createVerificationToken(user.email);
      await sendVerificationEmail({ to: user.email, token: rawToken, name: user.name });
    } catch (err) {
      console.error("[register] failed to send verification email", err);
    }
  }

  return NextResponse.json({ verificationRequired }, { status: 201 });
}

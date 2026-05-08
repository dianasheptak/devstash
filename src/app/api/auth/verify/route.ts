import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/auth/verification-token";

export const dynamic = "force-dynamic";

function appUrl(): string {
  return process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  const result = await consumeVerificationToken(token);

  if (!result.ok) {
    const reason = result.reason;
    return NextResponse.redirect(`${appUrl()}/sign-in?verify=${reason}`);
  }

  const user = await prisma.user.findUnique({ where: { email: result.email } });
  if (!user) {
    return NextResponse.redirect(`${appUrl()}/sign-in?verify=invalid`);
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  return NextResponse.redirect(`${appUrl()}/sign-in?verify=success`);
}

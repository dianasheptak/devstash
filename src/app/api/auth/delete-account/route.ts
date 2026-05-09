import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type DeleteAccountPayload = {
  confirm?: unknown;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload: DeleteAccountPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const confirm = typeof payload.confirm === "string" ? payload.confirm.trim().toLowerCase() : "";
  const expected = session.user.email.trim().toLowerCase();

  if (confirm !== expected) {
    return NextResponse.json(
      { error: "Confirmation does not match your email" },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reset password · DevStash",
};

export default async function ResetPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            DevStash
          </Link>
          <p className="text-sm text-muted-foreground">
            Choose a new password for your account
          </p>
        </div>

        <Suspense fallback={<div className="h-64" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}

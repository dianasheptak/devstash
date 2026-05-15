import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { HomepageNav } from "@/components/homepage/homepage-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in · DevStash",
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      <HomepageNav />
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              DevStash
            </Link>
            <p className="text-sm text-muted-foreground">
              Sign in to access your developer hub
            </p>
          </div>

          <Suspense fallback={<div className="h-64" />}>
            <SignInForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}

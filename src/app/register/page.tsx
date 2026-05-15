import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { HomepageNav } from "@/components/homepage/homepage-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create account · DevStash",
};

export default async function RegisterPage() {
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
              Create an account to start stashing
            </p>
          </div>

          <RegisterForm />
        </div>
      </main>
    </>
  );
}

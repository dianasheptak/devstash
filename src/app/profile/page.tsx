import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserAvatar } from "@/components/shared/user-avatar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile · DevStash",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/profile");

  const { name, email, image } = session.user;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Profile</h1>

      <div className="flex items-center gap-4 rounded-lg border border-border p-6">
        <UserAvatar name={name} email={email} image={image} size="lg" />
        <div className="min-w-0">
          <p className="text-base font-medium truncate">{name ?? "Unnamed user"}</p>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Profile editing is not implemented yet.
      </p>
    </main>
  );
}

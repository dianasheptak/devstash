import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileActions } from "@/components/profile/profile-actions";
import { EditorPreferencesForm } from "@/components/settings/editor-preferences-form";
import { parseEditorPreferences } from "@/lib/validation/editor-preferences";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings · DevStash",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, password: true, editorPreferences: true },
  });
  if (!user) redirect("/sign-in?callbackUrl=/settings");

  const editorPrefs = parseEditorPreferences(user.editorPreferences);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Editor Preferences
        </h2>
        <EditorPreferencesForm initial={editorPrefs} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Account
        </h2>
        <ProfileActions hasPassword={user.password !== null} email={user.email} />
      </section>
    </main>
  );
}

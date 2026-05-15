import { redirect } from "next/navigation";
import { LayoutGrid, FolderOpen, CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { getProfileData } from "@/lib/db/profile";
import { ICON_MAP } from "@/lib/constants/item-types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileActions } from "@/components/profile/profile-actions";
import { UpgradeCard } from "@/components/billing/upgrade-card";
import { ManageSubscriptionCard } from "@/components/billing/manage-subscription-card";
import { CheckoutToast } from "@/components/profile/checkout-toast";
import { intervalForPriceId } from "@/lib/stripe";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile · DevStash",
};

const TYPE_LABELS: Record<string, string> = {
  snippet: "Snippets",
  prompt: "Prompts",
  command: "Commands",
  note: "Notes",
  file: "Files",
  image: "Images",
  link: "Links",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/profile");

  const data = await getProfileData(session.user.id);
  if (!data) redirect("/sign-in?callbackUrl=/profile");

  const { user, totals, breakdown } = data;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your account information and usage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} email={user.email} image={user.image} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium truncate">
                {user.name ?? "Unnamed user"}
              </p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Joined {dateFormatter.format(user.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Usage
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Total Items</CardDescription>
                <LayoutGrid className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">{totals.items}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Collections</CardDescription>
                <FolderOpen className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">{totals.collections}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Items by type
        </h2>
        <Card size="sm">
          <ul className="divide-y divide-border">
            {breakdown.map((type) => {
              const Icon = ICON_MAP[type.icon];
              return (
                <li
                  key={type.id}
                  className="flex items-center gap-3 px-4 py-3 first:pt-3 last:pb-3"
                >
                  {Icon && (
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: type.color }}
                    />
                  )}
                  <span className="text-sm flex-1">
                    {TYPE_LABELS[type.name] ?? type.name}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {type.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Subscription
        </h2>
        {user.isPro ? (
          <ManageSubscriptionCard
            status={user.subscriptionStatus}
            interval={
              user.subscriptionPriceId
                ? intervalForPriceId(user.subscriptionPriceId)
                : null
            }
            periodEnd={user.subscriptionPeriodEnd}
            cancelAt={user.subscriptionCancelAt}
          />
        ) : (
          <UpgradeCard />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Account
        </h2>
        <ProfileActions hasPassword={user.hasPassword} email={user.email} />
      </section>

      <Suspense fallback={null}>
        <CheckoutToast />
      </Suspense>
    </main>
  );
}

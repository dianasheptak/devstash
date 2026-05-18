export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ICON_MAP, slugToTypeName } from '@/lib/constants/item-types';
import { getItemsByType } from '@/lib/db/items';
import { prisma } from '@/lib/prisma';
import { ItemCard } from '@/components/items/item-card';
import { AddTypeButton } from '@/components/items/add-type-button';
import { CREATABLE_ITEM_TYPES, type CreatableItemType } from '@/lib/validation/item';
import { isProType } from '@/lib/billing/limits';
import { UpgradeCard } from '@/components/billing/upgrade-card';

const TYPE_LABEL_PLURAL: Record<string, string> = {
  snippet: 'Snippets',
  prompt: 'Prompts',
  command: 'Commands',
  note: 'Notes',
  file: 'Files',
  image: 'Images',
  link: 'Links',
};

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: slug } = await params;
  const typeName = slugToTypeName(slug);
  if (!typeName) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/dashboard');

  const itemType = await prisma.itemType.findFirst({
    where: { name: typeName, isSystem: true },
    select: { icon: true, color: true },
  });

  const Icon = itemType ? ICON_MAP[itemType.icon] : null;
  const label = TYPE_LABEL_PLURAL[typeName];
  const isCreatable = (CREATABLE_ITEM_TYPES as readonly string[]).includes(typeName);
  const isPro = session.user.isPro;

  if (isProType(typeName) && !isPro) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <header className="flex items-center gap-3">
          {Icon && itemType && (
            <span className="size-6 shrink-0" style={{ color: itemType.color }}>
              <Icon className="size-6" />
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
        </header>
        <p className="text-sm text-muted-foreground">
          {label} are a Pro feature. Upgrade to upload and organize {label.toLowerCase()} in your stash.
        </p>
        <UpgradeCard />
      </div>
    );
  }

  const items = await getItemsByType(session.user.id, typeName);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-center gap-3">
        {Icon && itemType && (
          <span className="size-6 shrink-0" style={{ color: itemType.color }}>
            <Icon className="size-6" />
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
        <span className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
        {isCreatable && (
          <div className="ml-auto">
            <AddTypeButton type={typeName as CreatableItemType} label={label.slice(0, -1)} />
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  Star,
  Pin,
  LayoutGrid,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { mockItems } from '@/lib/mock-data';
import { getRecentCollections, getCollectionStats, type CollectionWithMeta } from '@/lib/db/collections';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </h2>
  );
}

function ItemCard({ item }: { item: (typeof mockItems)[number] }) {
  const Icon = ICON_MAP[item.itemType.icon];
  const preview =
    item.contentType === 'URL'
      ? item.url
      : item.content?.split('\n').slice(0, 2).join(' ').slice(0, 120);

  return (
    <Card size="sm" className="hover:ring-foreground/20 transition-shadow cursor-pointer">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="size-4 shrink-0" style={{ color: item.itemType.color }}>
              <Icon className="size-4" />
            </span>
          )}
          <CardTitle className="truncate">{item.title}</CardTitle>
          {item.isFavorite && (
            <Star className="size-3.5 ml-auto shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          {item.isPinned && (
            <Pin className="size-3.5 ml-auto shrink-0 text-muted-foreground" />
          )}
        </div>
        {item.description && (
          <CardDescription>{item.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-3 flex flex-col gap-2">
        {preview && (
          <p className="text-xs text-muted-foreground font-mono bg-muted/40 rounded px-2 py-1.5 whitespace-pre-wrap">
            {preview}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 h-4">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CollectionCard({ col }: { col: CollectionWithMeta }) {
  return (
    <Link href={`/collections/${col.id}`}>
      <Card
        size="sm"
        className="hover:ring-foreground/20 transition-shadow cursor-pointer h-full border-l-[3px]"
        style={{ borderLeftColor: col.dominantColor }}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="truncate">{col.name}</CardTitle>
            {col.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {col.description && (
            <CardDescription className="line-clamp-2">{col.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
          </span>
          {col.types.length > 0 && (
            <div className="flex items-center gap-1">
              {col.types.map((type) => {
                const Icon = ICON_MAP[type.icon];
                return Icon ? (
                  <Icon
                    key={type.name}
                    className="size-3"
                    style={{ color: type.color }}
                    aria-label={type.name}
                  />
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const [recentCollections, collectionStats] = await Promise.all([
    getRecentCollections(),
    getCollectionStats(),
  ]);

  const pinnedItems = mockItems.filter((i) => i.isPinned);
  const recentItems = [...mockItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const stats = [
    { label: 'Total Items', value: mockItems.length, icon: LayoutGrid },
    { label: 'Collections', value: collectionStats.total, icon: FolderOpen },
    { label: 'Favorite Items', value: mockItems.filter((i) => i.isFavorite).length, icon: Star },
    { label: 'Favorite Collections', value: collectionStats.favorites, icon: Star },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{label}</CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Recent Collections */}
      <section>
        <SectionHeading>Recent Collections</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recentCollections.map((col) => (
            <CollectionCard key={col.id} col={col} />
          ))}
        </div>
      </section>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <section>
          <SectionHeading>Pinned Items</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <SectionHeading>Recent Items</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

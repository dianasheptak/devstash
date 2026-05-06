import Link from 'next/link';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ICON_MAP } from '@/lib/constants/item-types';
import type { CollectionWithMeta } from '@/lib/db/collections';

export function CollectionCard({ col }: { col: CollectionWithMeta }) {
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

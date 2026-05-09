import { Star, Pin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ICON_MAP } from '@/lib/constants/item-types';
import type { ItemWithMeta } from '@/lib/db/items';

export function ItemCard({ item }: { item: ItemWithMeta }) {
  const Icon = ICON_MAP[item.itemType.icon];
  const preview =
    item.contentType === 'URL'
      ? item.url
      : item.content?.split('\n').slice(0, 2).join(' ').slice(0, 120);

  return (
    <Card
      size="sm"
      className="hover:ring-foreground/20 transition-shadow cursor-pointer border-l-[3px]"
      style={{ borderLeftColor: item.itemType.color }}
    >
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="size-4 shrink-0" style={{ color: item.itemType.color }}>
              <Icon className="size-4" />
            </span>
          )}
          <CardTitle className="truncate">{item.title}</CardTitle>
          {(item.isFavorite || item.isPinned) && (
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {item.isFavorite && (
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              )}
              {item.isPinned && (
                <Pin className="size-3.5 text-muted-foreground" />
              )}
            </div>
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

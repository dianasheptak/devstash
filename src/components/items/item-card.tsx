'use client';

import { Star, Pin, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ICON_MAP } from '@/lib/constants/item-types';
import { useItemDrawer } from './item-drawer-context';
import type { ItemWithMeta } from '@/lib/db/items';

export function ItemCard({ item }: { item: ItemWithMeta }) {
  const { open } = useItemDrawer();
  const Icon = ICON_MAP[item.itemType.icon];
  const preview =
    item.contentType === 'URL'
      ? item.url
      : item.content?.split('\n').slice(0, 2).join(' ').slice(0, 120);

  const copyValue =
    item.contentType === 'URL' ? item.url : item.contentType === 'TEXT' ? item.content : null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card
      size="sm"
      onClick={() => open(item.id)}
      className="hover:ring-foreground/20 hover:ring-1 transition-shadow cursor-pointer border-l-[3px]"
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
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {item.isFavorite && (
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
            )}
            {item.isPinned && (
              <Pin className="size-3.5 text-muted-foreground" />
            )}
            {copyValue && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy to clipboard"
                title="Copy to clipboard"
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted"
              >
                <Copy className="size-3.5" />
              </button>
            )}
          </div>
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

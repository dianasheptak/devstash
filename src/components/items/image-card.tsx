'use client';

import Image from 'next/image';
import { Star, Pin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useItemDrawer } from './item-drawer-context';
import type { ItemWithMeta } from '@/lib/db/items';

export function ImageCard({ item }: { item: ItemWithMeta }) {
  const { open } = useItemDrawer();

  return (
    <Card
      size="sm"
      onClick={() => open(item.id)}
      className="group hover:ring-foreground/20 hover:ring-1 transition-shadow cursor-pointer overflow-hidden p-0 gap-0"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={`/api/files/${item.id}`}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {(item.isFavorite || item.isPinned) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {item.isFavorite && (
              <Star className="size-3.5 fill-yellow-400 text-yellow-400 drop-shadow" />
            )}
            {item.isPinned && (
              <Pin className="size-3.5 text-white drop-shadow" />
            )}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t">
        <p className="text-sm font-medium truncate">{item.title}</p>
      </div>
    </Card>
  );
}

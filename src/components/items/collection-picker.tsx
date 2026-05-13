'use client';

import { cn } from '@/lib/utils';

export type CollectionOption = {
  id: string;
  name: string;
  description: string | null;
};

type Props = {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function CollectionPicker({ collections, selectedIds, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  if (collections.length === 0) {
    return <p className="text-xs text-muted-foreground">No collections yet.</p>;
  }

  return (
    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto rounded-md border p-1">
      {collections.map((col) => {
        const selected = selectedIds.includes(col.id);
        return (
          <button
            key={col.id}
            type="button"
            onClick={() => toggle(col.id)}
            className={cn(
              'flex items-start gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors cursor-pointer',
              selected ? 'bg-accent' : 'hover:bg-accent/50'
            )}
          >
            <span
              className={cn(
                'mt-0.5 size-3.5 rounded-sm border shrink-0 flex items-center justify-center',
                selected ? 'bg-primary border-primary' : 'border-muted-foreground'
              )}
            >
              {selected && (
                <svg
                  viewBox="0 0 12 12"
                  className="size-2.5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="flex flex-col gap-0.5 leading-tight">
              <span className="font-medium">{col.name}</span>
              {col.description && (
                <span className="text-muted-foreground line-clamp-1">{col.description}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

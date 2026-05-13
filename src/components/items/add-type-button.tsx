'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateItem } from './create-item-context';
import type { CreatableItemType } from '@/lib/validation/item';

export function AddTypeButton({
  type,
  label,
}: {
  type: CreatableItemType;
  label: string;
}) {
  const { open } = useCreateItem();
  return (
    <Button size="sm" onClick={() => open(type)} className="cursor-pointer">
      <Plus className="size-4" />
      New {label}
    </Button>
  );
}

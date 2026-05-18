'use client';

import { createContext, useContext, useState } from 'react';
import { CreateItemDialog } from './create-item-dialog';
import type { CreatableItemType } from '@/lib/validation/item';

type CreateItemContextValue = {
  open: (type?: CreatableItemType) => void;
};

const CreateItemContext = createContext<CreateItemContextValue | null>(null);

export function useCreateItem() {
  const ctx = useContext(CreateItemContext);
  if (!ctx) throw new Error('useCreateItem must be used inside CreateItemProvider');
  return ctx;
}

export function CreateItemProvider({
  children,
  isPro,
}: {
  children: React.ReactNode;
  isPro: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<CreatableItemType | undefined>();

  const open = (type?: CreatableItemType) => {
    setDefaultType(type);
    setIsOpen(true);
  };

  return (
    <CreateItemContext.Provider value={{ open }}>
      {children}
      <CreateItemDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultType={defaultType}
        isPro={isPro}
      />
    </CreateItemContext.Provider>
  );
}

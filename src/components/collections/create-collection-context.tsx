'use client';

import { createContext, useContext, useState } from 'react';
import { CreateCollectionDialog } from './create-collection-dialog';

type CreateCollectionContextValue = {
  open: () => void;
};

const CreateCollectionContext = createContext<CreateCollectionContextValue | null>(null);

export function useCreateCollection() {
  const ctx = useContext(CreateCollectionContext);
  if (!ctx) throw new Error('useCreateCollection must be used inside CreateCollectionProvider');
  return ctx;
}

export function CreateCollectionProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CreateCollectionContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <CreateCollectionDialog open={isOpen} onOpenChange={setIsOpen} />
    </CreateCollectionContext.Provider>
  );
}

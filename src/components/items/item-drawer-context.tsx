'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Ctx = {
  openItemId: string | null;
  open: (id: string) => void;
  close: () => void;
};

const ItemDrawerCtx = createContext<Ctx | null>(null);

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const open = useCallback((id: string) => setOpenItemId(id), []);
  const close = useCallback(() => setOpenItemId(null), []);

  return (
    <ItemDrawerCtx.Provider value={{ openItemId, open, close }}>
      {children}
    </ItemDrawerCtx.Provider>
  );
}

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerCtx);
  if (!ctx) throw new Error('useItemDrawer must be used inside ItemDrawerProvider');
  return ctx;
}

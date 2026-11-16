"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * Open / closed state of the dashboard sidebar drawer on phones and tablets
 * (below the lg breakpoint). The header's menu button and the sidebar are
 * siblings in a server layout, so they share it through this tiny context.
 * On desktop the sidebar is always visible and this state is ignored.
 */
interface MobileNavValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileNavContext = createContext<MobileNavValue>({ open: false, setOpen: () => {} });

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}

"use client";

import { SessionProvider } from "next-auth/react";
import { CommandPaletteProvider } from "./components/CommandPaletteProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CommandPaletteProvider />
    </SessionProvider>
  );
}

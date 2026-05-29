"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CommandPalette } from "./CommandPalette";

// Mounted once in app/providers.tsx so the palette and its global
// keyboard shortcut are available on every page. The keyboard listener
// only fires for authenticated users — there's nothing useful to do
// before login, and unauthenticated users would hit a 401 on the link
// search endpoint anyway.

export const COMMAND_PALETTE_EVENT = "linkly:open-palette";

// Lets any client component open the palette without prop-drilling a
// setter. Used by the sidebar's "⌘K" hint button.
export function openCommandPalette(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
  }
}

export function CommandPaletteProvider() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const authed = status === "authenticated";

  useEffect(() => {
    if (!authed) return;
    function onKey(event: KeyboardEvent) {
      // Cmd+K on macOS, Ctrl+K elsewhere — same shortcut Slack/Linear/
      // VSCode use, so it's already in muscle memory.
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && (event.key === "k" || event.key === "K")) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, [authed]);

  if (!authed) return null;
  return <CommandPalette open={open} onClose={() => setOpen(false)} />;
}

"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Dialog } from "./Dialog";

// Command palette — opens with Cmd+K (mac) / Ctrl+K (others). Built on
// top of the A3 Dialog primitive so focus trap, ESC dismissal and ARIA
// wiring are inherited. Search is plain `includes` against label/hint
// for static actions, and against id/url/title for the user's links.
// Heavier matching (Fuse.js etc.) can come later if list size justifies
// the dep — at <200 links per user this scan stays at sub-ms.

export interface LinkResult {
  id: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  disabled: boolean;
}

interface Action {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void | Promise<void>;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [links, setLinks] = useState<LinkResult[] | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  // Guards against a second fetch firing if linksLoading toggling
  // re-triggers the effect mid-await. We deliberately use a ref instead
  // of state so flipping it doesn't itself cause a re-render.
  const fetchInflight = useRef(false);

  // Build the static action set. router.push naturally closes the
  // palette via the parent onClose-on-run pattern below.
  const actions = useMemo<Action[]>(() => {
    const go = (path: string) => () => router.push(path);
    return [
      { id: "go.dashboard", label: "Ir al dashboard", group: "Navegar", run: go("/dashboard") },
      { id: "go.keys", label: "Claves de API", group: "Navegar", run: go("/dashboard/keys") },
      { id: "go.webhooks", label: "Webhooks", group: "Navegar", run: go("/dashboard/webhooks") },
      { id: "go.profile", label: "Perfil y cuenta", group: "Navegar", run: go("/dashboard/profile") },
      { id: "go.import", label: "Importar CSV", group: "Navegar", run: go("/dashboard/import") },
      { id: "go.home", label: "Acortar un enlace nuevo", hint: "Te lleva al formulario público", group: "Crear", run: go("/") },
      { id: "go.docs", label: "Documentación de la API", hint: "OpenAPI · Swagger UI", group: "Herramientas", run: go("/docs") },
      {
        id: "session.signout",
        label: "Cerrar sesión",
        group: "Sesión",
        run: () => signOut({ callbackUrl: "/" }),
      },
    ];
  }, [router]);

  // Filter actions client-side. Search is intentionally permissive: any
  // token in the query that appears in label/hint counts as a match.
  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((action) => {
      const hay = `${action.label} ${action.hint ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [actions, query]);

  const filteredLinks = useMemo(() => {
    if (!links || links.length === 0) return [];
    const q = query.trim().toLowerCase();
    if (!q) return links.slice(0, 6);
    return links
      .filter((link) => {
        const hay = `${link.id} ${link.originalUrl} ${link.title ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [links, query]);

  // Flat ordered list used for arrow-key navigation. Actions first,
  // then link results — matches the visual order rendered below.
  const flatItems = useMemo<Array<Action | { isLink: true; link: LinkResult }>>(() => {
    return [
      ...filteredActions,
      ...filteredLinks.map((link) => ({ isLink: true as const, link })),
    ];
  }, [filteredActions, filteredLinks]);

  // Fetch the user's links on first open. We cache them for the
  // lifetime of the palette mount — refetching on every open is wasteful
  // and the dashboard already drives most link mutations.
  useEffect(() => {
    if (!open || links !== null || fetchInflight.current) return;
    fetchInflight.current = true;
    setLinksLoading(true);
    setLinksError(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/links/search?limit=200");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { links: LinkResult[] };
        if (!cancelled) setLinks(data.links);
      } catch (err) {
        if (!cancelled) {
          setLinksError(err instanceof Error ? err.message : "Error");
          setLinks([]);
        }
      } finally {
        fetchInflight.current = false;
        if (!cancelled) setLinksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, links]);

  // Reset query + highlight every time the palette opens so the user
  // gets a clean slate (the most common interaction is "open, type,
  // hit Enter").
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlighted(0);
    }
  }, [open]);

  // Clamp highlight when the filtered set shrinks.
  useEffect(() => {
    if (highlighted >= flatItems.length) {
      setHighlighted(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, highlighted]);

  const invoke = useCallback(
    async (item: (typeof flatItems)[number] | undefined) => {
      if (!item) return;
      onClose();
      if ("isLink" in item) {
        router.push(`/stats/${item.link.id}`);
      } else {
        await item.run();
      }
    },
    [onClose, router]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((h) => Math.min(h + 1, Math.max(0, flatItems.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      void invoke(flatItems[highlighted]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      initialFocusId="command-palette-input"
      className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden outline-none"
    >
      <div onKeyDown={handleKeyDown}>
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2">
          <span className="text-gray-400" aria-hidden="true">
            ⌘
          </span>
          <input
            id="command-palette-input"
            type="text"
            placeholder="Busca un comando o un enlace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            aria-label="Buscar comandos"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            aria-activedescendant={
              flatItems[highlighted] ? itemDomId(flatItems[highlighted]) : undefined
            }
          />
        </div>

        <ul
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          className="max-h-80 overflow-y-auto py-1"
        >
          {filteredActions.length === 0 && filteredLinks.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-400">
              Sin resultados.
            </li>
          )}

          {filteredActions.map((action, idx) => {
            // Group header appears the first time we see a new group
            // value (the actions list is already ordered by group).
            const prev = filteredActions[idx - 1];
            const headerNeeded = !prev || prev.group !== action.group;
            return (
              <Fragment key={action.id}>
                {headerNeeded && (
                  <li
                    role="presentation"
                    className="mt-1 px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {action.group}
                  </li>
                )}
                <PaletteRow
                  id={itemDomId(action)}
                  label={action.label}
                  hint={action.hint}
                  selected={idx === highlighted}
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => void invoke(action)}
                />
              </Fragment>
            );
          })}

          {filteredLinks.length > 0 && (
            <li role="presentation" className="mt-1 px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Mis enlaces
            </li>
          )}
          {filteredLinks.map((link, i) => {
            const idx = filteredActions.length + i;
            return (
              <PaletteRow
                key={link.id}
                id={itemDomId({ isLink: true, link })}
                label={link.title ?? link.shortUrl}
                hint={`${link.id} · ${link.originalUrl}`}
                badge={link.disabled ? "pausado" : undefined}
                selected={idx === highlighted}
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => void invoke({ isLink: true, link })}
              />
            );
          })}

          {linksLoading && (
            <li className="px-4 py-2 text-xs text-gray-400">Cargando tus enlaces…</li>
          )}
          {linksError && (
            <li className="px-4 py-2 text-xs text-red-500">
              No pude cargar tus enlaces ({linksError})
            </li>
          )}
        </ul>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <span>↑ ↓ navegar · Enter para abrir · Esc para cerrar</span>
          <span>{flatItems.length} resultados</span>
        </div>
      </div>
    </Dialog>
  );
}

function itemDomId(item: Action | { isLink: true; link: LinkResult }): string {
  if ("isLink" in item) return `cp-link-${item.link.id}`;
  return `cp-${item.id}`;
}

function PaletteRow({
  id,
  label,
  hint,
  badge,
  selected,
  onMouseEnter,
  onClick,
}: {
  id: string;
  label: string;
  hint?: string;
  badge?: string;
  selected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
        selected
          ? "bg-blue-50 dark:bg-blue-900/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            selected
              ? "text-blue-900 dark:text-blue-100 font-medium"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {label}
        </p>
        {hint && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
      {badge && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {badge}
        </span>
      )}
    </li>
  );
}

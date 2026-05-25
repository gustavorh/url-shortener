"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CopyButton } from "../components/CopyButton";
import { Dialog } from "../components/Dialog";
import { splitTags } from "@/lib/tags";
import { faviconUrl } from "@/lib/favicon";
import { relativeTime } from "@/lib/format-date";
import { linkStatus, type LinkStatus } from "@/lib/link-status";

// Row data that the server component serializes and hands down. All
// dates are ISO strings so the prop boundary stays safe to cross.
export interface LinkRow {
  id: string;
  originalUrl: string;
  title: string | null;
  tags: string | null;
  clicks: number;
  disabled: boolean;
  creationDate: string;
  expirationDate: string | null;
  activeFrom: string | null;
  maxClicks: number | null;
}

interface Props {
  links: LinkRow[];
  baseUrl: string;
}

const STATUS_BADGE: Record<LinkStatus, { label: string; className: string }> = {
  active: { label: "", className: "" },
  disabled: {
    label: "Pausado",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  scheduled: {
    label: "Programado",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  expired: {
    label: "Expirado",
    className: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  },
  limit: {
    label: "Límite",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

type DialogKind = null | "delete" | "tag";

export function LinkTable({ links, baseUrl }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [dialogKind, setDialogKind] = useState<DialogKind>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleIds = useMemo(() => links.map((l) => l.id), [links]);

  // Header checkbox tri-state: none / some / all.
  const allChecked = selected.size > 0 && visibleIds.every((id) => selected.has(id));
  const someChecked = selected.size > 0 && !allChecked;

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setError(null);
  }

  async function runBulk(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      clearSelection();
      router.refresh();
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      throw err;
    } finally {
      setBusy(false);
      setDialogKind(null);
    }
  }

  async function onDelete() {
    await runBulk("/api/links/bulk/delete", { ids: [...selected] });
  }

  async function onDisable() {
    await runBulk("/api/links/bulk/disable", { ids: [...selected] });
  }

  async function onEnable() {
    await runBulk("/api/links/bulk/enable", { ids: [...selected] });
  }

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/links/bulk/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cortala-links-${selected.size}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                  aria-label="Seleccionar todos los enlaces visibles"
                  className="h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-4 font-medium">Enlace corto</th>
              <th className="p-4 font-medium">Destino</th>
              <th className="p-4 font-medium text-right">Clics</th>
              <th className="p-4 font-medium">Creado</th>
              <th className="p-4 font-medium">Expira</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {links.map((url) => {
              const tags = splitTags(url.tags);
              const status = linkStatus(url, url.clicks);
              const badge = STATUS_BADGE[status];
              const checked = selected.has(url.id);
              const fav = faviconUrl(url.originalUrl);
              return (
                <tr
                  key={url.id}
                  className={`border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${
                    checked
                      ? "bg-indigo-50 dark:bg-indigo-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleOne(url.id, e.target.checked)}
                      aria-label={`Seleccionar /${url.id}`}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={`${baseUrl}/${url.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        /{url.id}
                      </a>
                      <CopyButton value={`${baseUrl}/${url.id}`} />
                      {badge.label && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs text-gray-600 dark:text-gray-300">
                    <a
                      href={url.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 truncate hover:underline"
                      title={url.originalUrl}
                    >
                      {fav && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={fav}
                          alt=""
                          width={16}
                          height={16}
                          className="shrink-0 rounded-sm"
                        />
                      )}
                      <span className="truncate">
                        {url.title || url.originalUrl}
                      </span>
                    </a>
                    {tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {tags.map((t) => (
                          <Link
                            key={t}
                            href={`/dashboard?tag=${encodeURIComponent(t)}`}
                            className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                    {url.clicks}
                  </td>
                  <td
                    className="p-4 text-gray-500 dark:text-gray-400"
                    title={format(new Date(url.creationDate), "yyyy-MM-dd HH:mm")}
                  >
                    {relativeTime(url.creationDate)}
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400">
                    {url.expirationDate
                      ? format(
                          new Date(url.expirationDate),
                          "yyyy-MM-dd HH:mm"
                        )
                      : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/stats/${url.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Estadísticas
                      </Link>
                      <a
                        href={`/api/qr/${url.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 dark:text-gray-400 hover:underline"
                      >
                        QR
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <ActionBar
          count={selected.size}
          busy={busy}
          error={error}
          onDelete={() => setDialogKind("delete")}
          onDisable={onDisable}
          onEnable={onEnable}
          onTag={() => setDialogKind("tag")}
          onExport={onExport}
          onClear={clearSelection}
        />
      )}

      <Dialog
        open={dialogKind === "delete"}
        onClose={() => setDialogKind(null)}
        title="Eliminar enlaces"
        description={`Esto soft-elimina ${selected.size} enlace${
          selected.size === 1 ? "" : "s"
        }. No es reversible desde la UI.`}
      >
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => setDialogKind(null)}
            className="btn-secondary"
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </Dialog>

      {dialogKind === "tag" && (
        <TagDialog
          count={selected.size}
          busy={busy}
          onCancel={() => setDialogKind(null)}
          onSubmit={async (tag, action) => {
            await runBulk("/api/links/bulk/tag", {
              ids: [...selected],
              tag,
              action,
            });
          }}
        />
      )}
    </>
  );
}

function ActionBar({
  count,
  busy,
  error,
  onDelete,
  onDisable,
  onEnable,
  onTag,
  onExport,
  onClear,
}: {
  count: number;
  busy: boolean;
  error: string | null;
  onDelete: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onTag: () => void;
  onExport: () => void;
  onClear: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Acciones masivas"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-3xl w-[calc(100%-2rem)]"
    >
      <div className="rounded-xl shadow-xl bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">
          {count} seleccionado{count === 1 ? "" : "s"}
        </span>
        <span className="text-gray-500" aria-hidden="true">
          ·
        </span>
        <button type="button" onClick={onTag} disabled={busy} className="bulk-btn">
          Etiquetar
        </button>
        <button type="button" onClick={onDisable} disabled={busy} className="bulk-btn">
          Pausar
        </button>
        <button type="button" onClick={onEnable} disabled={busy} className="bulk-btn">
          Reactivar
        </button>
        <button type="button" onClick={onExport} disabled={busy} className="bulk-btn">
          Exportar
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="bulk-btn bulk-btn-danger"
        >
          Eliminar
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="ml-auto text-xs text-gray-300 hover:text-white"
        >
          Cancelar selección
        </button>
        {error && (
          <p role="alert" className="basis-full text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function TagDialog({
  count,
  busy,
  onCancel,
  onSubmit,
}: {
  count: number;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (tag: string, action: "add" | "remove") => Promise<void>;
}) {
  const [tag, setTag] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");

  return (
    <Dialog
      open
      onClose={onCancel}
      title="Etiquetar selección"
      description={`Aplica una etiqueta a ${count} enlace${
        count === 1 ? "" : "s"
      }. Se normaliza igual que en el editor individual.`}
      initialFocusId="bulk-tag-input"
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (!tag.trim()) return;
          void onSubmit(tag.trim(), action);
        }}
        className="space-y-3"
      >
        <div>
          <label htmlFor="bulk-tag-input" className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
            Etiqueta
          </label>
          <input
            id="bulk-tag-input"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="marketing"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            required
          />
        </div>

        <fieldset className="flex gap-4 text-sm">
          <legend className="sr-only">Acción</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="action"
              value="add"
              checked={action === "add"}
              onChange={() => setAction("add")}
            />
            Añadir
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="action"
              value="remove"
              checked={action === "remove"}
              onChange={() => setAction("remove")}
            />
            Quitar
          </label>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || !tag.trim()}
            className="btn-primary"
          >
            {busy ? "Aplicando…" : action === "add" ? "Añadir etiqueta" : "Quitar etiqueta"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

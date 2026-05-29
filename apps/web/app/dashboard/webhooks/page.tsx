"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppSidebar } from "../../components/AppSidebar";
import { CopyButton } from "../../components/CopyButton";
import { Dialog } from "../../components/Dialog";
import { WEBHOOK_EVENTS } from "@linkly/schemas/webhooks";

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  active: boolean;
  createdAt: string;
}

interface DeliveryRow {
  id: string;
  event: string;
  status: "pending" | "success" | "failed";
  attempts: number;
  responseStatus: number | null;
  lastError: string | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookRow | null>(null);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(
    null
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/webhooks");
    if (!res.ok) return;
    const data = (await res.json()) as { webhooks: WebhookRow[] };
    setRows(data.webhooks);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este webhook? Esta acción no se puede deshacer.")) {
      return;
    }
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    await load();
  };

  const onTest = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
    if (res.ok) {
      alert("Evento de prueba enviado. Revisa el log de entregas en tu panel.");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo enviar el evento de prueba.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <AppSidebar active="dashboard" />

      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← Volver al panel
          </Link>
          <div className="mt-4 mb-2 flex items-end justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Webhooks
            </h1>
            <button
              onClick={() => {
                setError("");
                setCreateOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              + Nuevo webhook
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Recibe notificaciones HTTP cuando ocurren eventos en tus enlaces.
            Cada entrega lleva una firma{" "}
            <code className="text-sm bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              X-Linkly-Signature
            </code>{" "}
            (HMAC-SHA256) que verifica que el evento viene de Linkly.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-200"
            >
              {error}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
              Aún no tienes webhooks. Crea uno para empezar a recibir eventos.
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((w) => (
                <WebhookCard
                  key={w.id}
                  row={w}
                  onDelete={() => onDelete(w.id)}
                  onTest={() => onTest(w.id)}
                  onEdit={() => setEditing(w)}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear webhook"
        description="Recibirás un POST firmado en esta URL cada vez que ocurra uno de los eventos seleccionados."
        className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl outline-none"
      >
        <WebhookForm
          mode="create"
          onCancel={() => setCreateOpen(false)}
          onSaved={(secret, id) => {
            setCreateOpen(false);
            setNewSecret({ id, secret });
            void load();
          }}
          onError={setError}
        />
      </Dialog>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar webhook"
        className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl outline-none"
      >
        {editing && (
          <WebhookForm
            mode="edit"
            initial={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              void load();
            }}
            onError={setError}
          />
        )}
      </Dialog>

      <Dialog
        open={newSecret !== null}
        onClose={() => setNewSecret(null)}
        title="Guarda tu secret"
        description="Esta es la única vez que verás este secret. Úsalo para verificar la firma X-Linkly-Signature en tu servidor."
      >
        {newSecret && (
          <div className="space-y-4">
            <code className="block break-all bg-gray-100 dark:bg-gray-900 rounded p-3 text-sm">
              {newSecret.secret}
            </code>
            <div className="flex justify-end gap-2">
              <CopyButton value={newSecret.secret} label="Copiar secret" />
              <button
                onClick={() => setNewSecret(null)}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function WebhookCard({
  row,
  onDelete,
  onTest,
  onEdit,
}: {
  row: WebhookRow;
  onDelete: () => void;
  onTest: () => void;
  onEdit: () => void;
}) {
  const [deliveries, setDeliveries] = useState<DeliveryRow[] | null>(null);

  const toggleDeliveries = async () => {
    if (deliveries !== null) {
      setDeliveries(null);
      return;
    }
    const res = await fetch(`/api/webhooks/${row.id}/deliveries`);
    if (res.ok) {
      const data = (await res.json()) as { deliveries: DeliveryRow[] };
      setDeliveries(data.deliveries);
    }
  };

  return (
    <li className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                row.active ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-label={row.active ? "activo" : "pausado"}
            />
            <code className="truncate text-sm text-gray-900 dark:text-gray-100">
              {row.url}
            </code>
          </div>
          {row.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {row.description}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {row.events.length === 0
              ? "Todos los eventos"
              : row.events.join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onTest}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Probar
          </button>
          <button
            onClick={toggleDeliveries}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {deliveries === null ? "Ver entregas" : "Ocultar"}
          </button>
          <button
            onClick={onEdit}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Eliminar
          </button>
        </div>
      </div>

      {deliveries !== null && (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          {deliveries.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No hay entregas registradas.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {deliveries.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      d.status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                        : d.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {d.status}
                  </span>
                  <code className="text-xs">{d.event}</code>
                  <span>
                    {d.responseStatus !== null && `HTTP ${d.responseStatus} · `}
                    {d.attempts} intento{d.attempts === 1 ? "" : "s"}
                  </span>
                  {d.lastError && (
                    <span className="text-red-600 dark:text-red-300 truncate">
                      {d.lastError}
                    </span>
                  )}
                  <span className="ml-auto text-gray-400">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function WebhookForm({
  mode,
  initial,
  onCancel,
  onSaved,
  onError,
}: {
  mode: "create" | "edit";
  initial?: WebhookRow;
  onCancel: () => void;
  onSaved: (secret: string, id: string) => void;
  onError: (msg: string) => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [events, setEvents] = useState<string[]>(initial?.events ?? []);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (e: string) => {
    setEvents((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify({
        url,
        events,
        description: description || null,
        active,
      });
      const res =
        mode === "create"
          ? await fetch("/api/webhooks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            })
          : await fetch(`/api/webhooks/${initial!.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body,
            });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }
      onSaved(data.secret ?? "", data.id ?? initial?.id ?? "");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="webhook-url"
          className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
        >
          URL del endpoint
        </label>
        <input
          id="webhook-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          placeholder="https://tu-dominio.com/webhooks/linkly"
        />
      </div>

      <div>
        <label
          htmlFor="webhook-desc"
          className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
        >
          Descripción <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          id="webhook-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          placeholder="Para qué uso este webhook"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Eventos a suscribir{" "}
          <span className="text-gray-400">(vacío = todos)</span>
        </legend>
        <div className="grid grid-cols-2 gap-1">
          {WEBHOOK_EVENTS.map((ev) => (
            <label
              key={ev}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                checked={events.includes(ev)}
                onChange={() => toggleEvent(ev)}
              />
              <code className="text-xs">{ev}</code>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Activo
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
        >
          {saving ? "Guardando…" : mode === "create" ? "Crear webhook" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

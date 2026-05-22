"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkEditorProps {
  linkId: string;
  initialTitle: string | null;
  initialUrl: string;
  initialExpiration: string | null;
  initialTags: string | null;
  initialMaxClicks: number | null;
  initialDisabled: boolean;
  initialActiveFrom: string | null;
}

// Edits a link's title, destination, schedule, tags and state.
export function LinkEditor({
  linkId,
  initialTitle,
  initialUrl,
  initialExpiration,
  initialTags,
  initialMaxClicks,
  initialDisabled,
  initialActiveFrom,
}: LinkEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [url, setUrl] = useState(initialUrl);
  const [expiration, setExpiration] = useState(initialExpiration ?? "");
  const [activeFrom, setActiveFrom] = useState(initialActiveFrom ?? "");
  const [tags, setTags] = useState(initialTags ?? "");
  const [maxClicks, setMaxClicks] = useState(
    initialMaxClicks != null ? String(initialMaxClicks) : ""
  );
  const [disabled, setDisabled] = useState(initialDisabled);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const dirty =
    title !== (initialTitle ?? "") ||
    url !== initialUrl ||
    expiration !== (initialExpiration ?? "") ||
    activeFrom !== (initialActiveFrom ?? "") ||
    tags !== (initialTags ?? "") ||
    maxClicks !== (initialMaxClicks != null ? String(initialMaxClicks) : "") ||
    disabled !== initialDisabled;

  const save = async () => {
    setStatus("saving");
    setError("");
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          originalUrl: url,
          expirationDate: expiration || null,
          activeFrom: activeFrom || null,
          tags,
          maxClicks: maxClicks ? Number(maxClicks) : null,
          disabled,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo guardar");
      }
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setStatus("idle");
    }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Editar enlace
      </h3>
      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="edit-title">
            Título
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            maxLength={120}
            placeholder="Opcional"
            onChange={(e) => {
              setTitle(e.target.value);
              setStatus("idle");
            }}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="edit-url">
            Destino
          </label>
          <input
            id="edit-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setStatus("idle");
            }}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="edit-expiration">
            Expiración{" "}
            <span className="font-normal text-gray-400">
              (vacío = sin expiración)
            </span>
          </label>
          <input
            id="edit-expiration"
            type="datetime-local"
            value={expiration}
            onChange={(e) => {
              setExpiration(e.target.value);
              setStatus("idle");
            }}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-active-from">
            Activación programada{" "}
            <span className="font-normal text-gray-400">
              (vacío = activo ya)
            </span>
          </label>
          <input
            id="edit-active-from"
            type="datetime-local"
            value={activeFrom}
            onChange={(e) => {
              setActiveFrom(e.target.value);
              setStatus("idle");
            }}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-tags">
            Etiquetas{" "}
            <span className="font-normal text-gray-400">
              (separadas por comas)
            </span>
          </label>
          <input
            id="edit-tags"
            type="text"
            value={tags}
            placeholder="marketing, campaña-q1"
            onChange={(e) => {
              setTags(e.target.value);
              setStatus("idle");
            }}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-max-clicks">
            Límite de clics{" "}
            <span className="font-normal text-gray-400">
              (vacío = sin límite)
            </span>
          </label>
          <input
            id="edit-max-clicks"
            type="number"
            min={1}
            value={maxClicks}
            placeholder="Sin límite"
            onChange={(e) => {
              setMaxClicks(e.target.value);
              setStatus("idle");
            }}
            className="input"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={disabled}
            onChange={(e) => {
              setDisabled(e.target.checked);
              setStatus("idle");
            }}
          />
          <span className="relative h-6 w-11 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-amber-500 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pausar enlace (deja de redirigir)
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          onClick={save}
          disabled={status === "saving" || !dirty}
          className="btn-primary"
        >
          {status === "saving"
            ? "Guardando..."
            : status === "saved"
              ? "Guardado ✓"
              : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

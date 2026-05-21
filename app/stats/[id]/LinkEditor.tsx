"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkEditorProps {
  linkId: string;
  initialTitle: string | null;
  initialUrl: string;
  initialExpiration: string | null;
}

// Edits a link's title, destination and expiration in one place.
export function LinkEditor({
  linkId,
  initialTitle,
  initialUrl,
  initialExpiration,
}: LinkEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [url, setUrl] = useState(initialUrl);
  const [expiration, setExpiration] = useState(initialExpiration ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const dirty =
    title !== (initialTitle ?? "") ||
    url !== initialUrl ||
    expiration !== (initialExpiration ?? "");

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

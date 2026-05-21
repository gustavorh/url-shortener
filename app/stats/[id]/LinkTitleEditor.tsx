"use client";

import { useState } from "react";

// Inline editor for a link's display title (used on link-in-bio pages).
export function LinkTitleEditor({
  linkId,
  initialTitle,
}: {
  linkId: string;
  initialTitle: string | null;
}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const save = async () => {
    setStatus("saving");
    await fetch(`/api/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setStatus("saved");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={title}
        maxLength={120}
        placeholder="Título del enlace (opcional)"
        onChange={(e) => {
          setTitle(e.target.value);
          setStatus("idle");
        }}
        className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      />
      <button
        onClick={save}
        disabled={status === "saving"}
        className="py-2 px-4 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-70"
      >
        {status === "saving"
          ? "Guardando..."
          : status === "saved"
            ? "Guardado ✓"
            : "Guardar título"}
      </button>
    </div>
  );
}

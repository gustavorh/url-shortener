"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Soft-deletes a link after an inline confirmation, then returns to the panel.
export function DeleteLinkButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/links/${linkId}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 dark:text-red-400 hover:underline"
      >
        Eliminar enlace
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 dark:text-gray-300">¿Eliminar?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 dark:text-red-400 font-medium hover:underline disabled:opacity-70"
      >
        {deleting ? "Eliminando..." : "Sí, eliminar"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-gray-500 dark:text-gray-400 hover:underline"
      >
        Cancelar
      </button>
    </span>
  );
}

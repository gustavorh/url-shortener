"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary: catches render/data errors in any segment.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md card p-10 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Algo salió mal
        </h1>
        <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
          Ocurrió un error inesperado. Puedes reintentar o volver al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Reintentar
          </button>
          <Link href="/" className="btn-secondary">
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

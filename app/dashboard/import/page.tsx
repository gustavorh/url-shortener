"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import { AppSidebar } from "../../components/AppSidebar";

interface BulkResult {
  originalUrl: string;
  ok: boolean;
  shortUrl?: string;
  error?: string;
}

const MAX_URLS = 100;

export default function ImportPage() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const parseLines = (raw: string): string[] =>
    raw
      .split(/\r?\n/)
      // Support CSV: take the first column of each line.
      .map((line) => line.split(",")[0]?.trim() ?? "")
      .filter(Boolean);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(parseLines(content).join("\n"));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const urls = parseLines(text);
    if (urls.length === 0) {
      setError("Agrega al menos una URL");
      return;
    }
    if (urls.length > MAX_URLS) {
      setError(`Máximo ${MAX_URLS} URLs por importación`);
      return;
    }

    setIsLoading(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch("/api/links/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al importar");
      }
      setResults(data.results as BulkResult[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setIsLoading(false);
    }
  };

  const createdCount = results?.filter((r) => r.ok).length ?? 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <AppSidebar active="dashboard" />

      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← Volver al panel
          </Link>
          <h1 className="mt-4 mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Importar URLs en masa
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Pega una URL por línea o sube un archivo CSV (se usa la primera
            columna). Máximo {MAX_URLS} por lote.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={"https://ejemplo.com/uno\nhttps://ejemplo.com/dos"}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />

            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-2">Archivo CSV:</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFile}
                  className="text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary ml-auto"
              >
                {isLoading ? "Procesando..." : "Acortar todo"}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
          </form>

          {results && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                {createdCount} de {results.length} URLs acortadas
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {results.map((item, index) => (
                    <tr
                      key={`${item.originalUrl}-${index}`}
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                    >
                      <td className="p-3 max-w-xs truncate text-gray-600 dark:text-gray-400">
                        {item.originalUrl}
                      </td>
                      <td className="p-3">
                        {item.ok ? (
                          <a
                            href={item.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {item.shortUrl}
                          </a>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            {item.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

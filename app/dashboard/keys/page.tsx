"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import Link from "next/link";
import { AppSidebar } from "../../components/AppSidebar";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadKeys = useCallback(async () => {
    const response = await fetch("/api/keys");
    if (response.ok) {
      const data = await response.json();
      setKeys(data.keys as ApiKeyRow[]);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setCreatedKey(null);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la clave");
      }
      setCreatedKey(data.key as string);
      setName("");
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    await loadKeys();
  };

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
            Claves de API
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Usa una clave para autenticar la API REST:{" "}
            <code className="text-sm bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              Authorization: Bearer &lt;clave&gt;
            </code>
          </p>

          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5 mb-6 flex flex-wrap gap-3 items-end"
          >
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="key-name"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
              >
                Nombre de la clave
              </label>
              <input
                id="key-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: integración CI"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? "Creando..." : "Crear clave"}
            </button>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {createdKey && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Copia tu clave ahora — no volverá a mostrarse:
              </p>
              <code className="block break-all text-sm bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-700">
                {createdKey}
              </code>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {keys.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                Aún no tienes claves de API.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 font-medium">Nombre</th>
                    <th className="p-4 font-medium">Prefijo</th>
                    <th className="p-4 font-medium">Estado</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                    >
                      <td className="p-4 text-gray-900 dark:text-white">
                        {key.name}
                      </td>
                      <td className="p-4">
                        <code className="text-gray-600 dark:text-gray-400">
                          {key.prefix}…
                        </code>
                      </td>
                      <td className="p-4">
                        {key.revokedAt ? (
                          <span className="text-red-600 dark:text-red-400">
                            Revocada
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            Activa
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!key.revokedAt && (
                          <button
                            onClick={() => handleRevoke(key.id)}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

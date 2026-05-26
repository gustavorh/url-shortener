"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";

interface LinkTarget {
  id: number;
  url: string;
  kind: "device" | "rotation";
  device: string | null;
}

const DEVICE_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  desktop: "Escritorio",
};

export function LinkTargetsManager({ linkId }: { linkId: string }) {
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [kind, setKind] = useState<"device" | "rotation">("device");
  const [device, setDevice] = useState("ios");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/links/${linkId}/targets`);
    if (response.ok) {
      const data = await response.json();
      setTargets(data.targets as LinkTarget[]);
    }
  }, [linkId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/links/${linkId}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          kind,
          device: kind === "device" ? device : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al añadir");
      setUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (targetId: number) => {
    await fetch(`/api/links/${linkId}/targets/${targetId}`, {
      method: "DELETE",
    });
    await load();
  };

  const deviceTargets = targets.filter((t) => t.kind === "device");
  const rotationTargets = targets.filter((t) => t.kind === "rotation");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Destinos inteligentes
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Redirige según el dispositivo, o reparte el tráfico entre varias URLs
        (rotación A/B). Sin destinos, el enlace usa siempre su URL original.
      </p>

      {(deviceTargets.length > 0 || rotationTargets.length > 0) && (
        <ul className="mb-4 space-y-2">
          {deviceTargets.map((target) => (
            <li
              key={target.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300 truncate">
                <span className="inline-block px-2 py-0.5 mr-2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                  {DEVICE_LABELS[target.device ?? ""] ?? target.device}
                </span>
                {target.url}
              </span>
              <button
                onClick={() => handleDelete(target.id)}
                className="text-red-600 dark:text-red-400 hover:underline shrink-0"
              >
                Quitar
              </button>
            </li>
          ))}
          {rotationTargets.map((target) => (
            <li
              key={target.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300 truncate">
                <span className="inline-block px-2 py-0.5 mr-2 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">
                  A/B
                </span>
                {target.url}
              </span>
              <button
                onClick={() => handleDelete(target.id)}
                className="text-red-600 dark:text-red-400 hover:underline shrink-0"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        aria-label="Añadir un destino al enlace"
        className="flex flex-wrap items-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-4"
      >
        <label htmlFor="target-kind" className="sr-only">
          Tipo de destino
        </label>
        <select
          id="target-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "device" | "rotation")}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="device">Por dispositivo</option>
          <option value="rotation">Rotación A/B</option>
        </select>
        {kind === "device" && (
          <>
            <label htmlFor="target-device" className="sr-only">
              Dispositivo
            </label>
            <select
              id="target-device"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="desktop">Escritorio</option>
            </select>
          </>
        )}
        <label htmlFor="target-url" className="sr-only">
          URL de destino
        </label>
        <input
          id="target-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://destino..."
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          Añadir
        </button>
      </form>
      {error && (
        <p
          role="alert"
          className="mt-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

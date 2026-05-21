"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AppSidebar } from "./components/AppSidebar";
import { appendUtmParams, hasAnyUtm, UtmParams } from "@/lib/utm";

interface ShortenResult {
  shortUrl: string;
  id: string;
}

const EMPTY_UTM: UtmParams = {
  source: "",
  medium: "",
  campaign: "",
  term: "",
  content: "",
};

const UTM_FIELDS: { key: keyof UtmParams; label: string }[] = [
  { key: "source", label: "Source (utm_source)" },
  { key: "medium", label: "Medium (utm_medium)" },
  { key: "campaign", label: "Campaign (utm_campaign)" },
  { key: "term", label: "Term (utm_term)" },
  { key: "content", label: "Content (utm_content)" },
];

export default function Home() {
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [showUtm, setShowUtm] = useState(false);
  const [utm, setUtm] = useState<UtmParams>(EMPTY_UTM);

  useEffect(() => {
    if (hasExpiration) {
      setExpirationDate(getDefaultExpirationDate());
    }
  }, [hasExpiration]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      // Apply UTM parameters to the destination URL before shortening.
      const finalUrl =
        showUtm && hasAnyUtm(utm) ? appendUtmParams(url, utm) : url;

      const payload: {
        originalUrl: string;
        expirationDate?: string;
        customAlias?: string;
      } = { originalUrl: finalUrl };

      if (hasExpiration && expirationDate) {
        payload.expirationDate = formatDateForAPI(expirationDate);
      }
      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim();
      }

      const response = await fetch("/api/shorten-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al acortar la URL");
      }

      setResult({ shortUrl: data.shortUrl, id: data.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al acortar la URL");
    } finally {
      setIsLoading(false);
    }
  };

  // Default expiration: now + 1 day, formatted as dd/mm/yyyy hh:mm.
  const getDefaultExpirationDate = () => formatDate(addDays(new Date(), 1));
  const getCurrentDateExample = () => formatDate(new Date());

  const formatDateForAPI = (dateString: string) => {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/");
    const [hours, minutes] = timePart ? timePart.split(":") : ["00", "00"];
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  };

  const isValidExpirationDate = (dateString: string) => {
    try {
      const [datePart, timePart] = dateString.split(" ");
      const [day, month, year] = datePart.split("/").map(Number);
      const [hours, minutes] = timePart
        ? timePart.split(":").map(Number)
        : [0, 0];
      const inputDate = new Date(year, month - 1, day, hours, minutes);
      const minDate = new Date();
      minDate.setMinutes(minDate.getMinutes() + 5);
      return inputDate >= minDate;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <AppSidebar active="home" />

      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Acorta tus enlaces en segundos
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Crea links cortos, personalízalos con tu propio alias y mide
              cada clic.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-10 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
                >
                  Ingresa el enlace que quieres acortar
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="custom-alias"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
                >
                  Alias personalizado{" "}
                  <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  id="custom-alias"
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="mi-enlace"
                  pattern="[a-zA-Z0-9_-]{3,32}"
                  title="Entre 3 y 32 caracteres: letras, números, guion o guion bajo"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  3-32 caracteres: letras, números, guion o guion bajo.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowUtm(!showUtm)}
                  className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2"
                >
                  <span className="text-xs">{showUtm ? "▾" : "▸"}</span>
                  Parámetros UTM de campaña (opcional)
                </button>
                {showUtm && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    {UTM_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={utm[key] ?? ""}
                          onChange={(e) =>
                            setUtm({ ...utm, [key]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="expiration-toggle"
                  checked={hasExpiration}
                  onChange={(e) => setHasExpiration(e.target.checked)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="expiration-toggle"
                  className="text-sm font-medium text-gray-800 dark:text-gray-200"
                >
                  Establecer fecha de expiración
                </label>
              </div>

              {hasExpiration && (
                <div>
                  <label
                    htmlFor="expiration-date"
                    className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
                  >
                    Fecha y hora de expiración
                  </label>
                  <input
                    id="expiration-date"
                    type="text"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    placeholder="dd/mm/yyyy hh:mm"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Formato: dd/mm/yyyy hh:mm (por ejemplo,{" "}
                    {getCurrentDateExample()})
                  </p>
                  {expirationDate && !isValidExpirationDate(expirationDate) && (
                    <p className="mt-1 text-sm text-red-500">
                      La fecha debe ser al menos 5 minutos en el futuro
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  (hasExpiration && !isValidExpirationDate(expirationDate))
                }
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Procesando..." : "Acortar URL"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-3">
                  ¡URL acortada con éxito!
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
                  >
                    {result.shortUrl}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.shortUrl);
                    }}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                    title="Copiar al portapapeles"
                  >
                    Copiar
                  </button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr/${result.id}`}
                    alt="Código QR del enlace"
                    width={140}
                    height={140}
                    className="rounded border border-gray-200 dark:border-gray-700 bg-white"
                  />
                  <div className="space-y-2 text-sm">
                    <a
                      href={`/api/qr/${result.id}`}
                      download={`qr-${result.id}.png`}
                      className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Descargar código QR
                    </a>
                    {session ? (
                      <Link
                        href={`/stats/${result.id}`}
                        className="block text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Ver estadísticas del enlace
                      </Link>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        <Link
                          href="/login"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Inicia sesión
                        </Link>{" "}
                        para guardar este enlace y ver sus estadísticas.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

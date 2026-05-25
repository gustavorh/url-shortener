"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AppSidebar } from "./components/AppSidebar";
import { appendUtmParams, hasAnyUtm, UtmParams } from "@/lib/utm";

interface ShortenResult {
  shortUrl: string;
  id: string;
  reused: boolean;
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

const FEATURES = [
  {
    title: "Alias a tu medida",
    description: "Elige el código corto o deja que lo generemos por ti.",
  },
  {
    title: "Analítica real",
    description: "Mide clics, dispositivos y países de cada enlace.",
  },
  {
    title: "Códigos QR",
    description: "Genera y descarga un QR para cada enlace al instante.",
  },
];

export default function Home() {
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [showUtm, setShowUtm] = useState(false);
  const [utm, setUtm] = useState<UtmParams>(EMPTY_UTM);
  const [stats, setStats] = useState<{ links: number; clicks: number } | null>(
    null
  );

  useEffect(() => {
    if (hasExpiration) {
      setExpirationDate(getDefaultExpirationDate());
    }
  }, [hasExpiration]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      // Apply UTM parameters to the destination URL before shortening.
      const finalUrl =
        showUtm && hasAnyUtm(utm) ? appendUtmParams(url, utm) : url;

      const payload: {
        originalUrl: string;
        expirationDate?: string;
        customAlias?: string;
        password?: string;
      } = { originalUrl: finalUrl };

      if (hasExpiration && expirationDate) {
        payload.expirationDate = formatDateForAPI(expirationDate);
      }
      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim();
      }
      if (password) {
        payload.password = password;
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

      setResult({
        shortUrl: data.shortUrl,
        id: data.id,
        reused: !!data.reused,
      });
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

  const copyShortUrl = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="home" />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-6 py-10 md:px-12 md:py-12 mt-14 md:mt-0 outline-none"
      >
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              Rápido · gratuito · sin fricción
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Acorta tus enlaces{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                en segundos
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
              Crea links cortos, personalízalos con tu propio alias y mide cada
              clic.
            </p>
            {stats && stats.links > 0 && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-300">
                  {stats.links.toLocaleString()}
                </strong>{" "}
                enlaces acortados ·{" "}
                <strong className="text-gray-700 dark:text-gray-300">
                  {stats.clicks.toLocaleString()}
                </strong>{" "}
                clics servidos
              </p>
            )}
          </div>

          {/* Shortener form */}
          <div className="card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="url" className="label">
                  Enlace que quieres acortar
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="custom-alias" className="label">
                  Alias personalizado{" "}
                  <span className="font-normal text-gray-500 dark:text-gray-400">(opcional)</span>
                </label>
                <input
                  id="custom-alias"
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="mi-enlace"
                  pattern="[a-zA-Z0-9_-]{3,32}"
                  title="Entre 3 y 32 caracteres: letras, números, guion o guion bajo"
                  className="input"
                />
                <p className="field-hint">
                  3-32 caracteres: letras, números, guion o guion bajo.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Contraseña{" "}
                  <span className="font-normal text-gray-500 dark:text-gray-400">(opcional)</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Protege el enlace con una contraseña"
                  className="input"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowUtm(!showUtm)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="text-xs text-indigo-500">
                    {showUtm ? "▾" : "▸"}
                  </span>
                  Parámetros UTM de campaña (opcional)
                </button>
                {showUtm && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    {UTM_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={utm[key] ?? ""}
                          onChange={(e) =>
                            setUtm({ ...utm, [key]: e.target.value })
                          }
                          className="input py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={hasExpiration}
                  onChange={(e) => setHasExpiration(e.target.checked)}
                />
                <span className="relative h-6 w-11 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-indigo-600 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Establecer fecha de expiración
                </span>
              </label>

              {hasExpiration && (
                <div>
                  <label htmlFor="expiration-date" className="label">
                    Fecha y hora de expiración
                  </label>
                  <input
                    id="expiration-date"
                    type="text"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    placeholder="dd/mm/yyyy hh:mm"
                    className="input"
                  />
                  <p className="field-hint">
                    Formato: dd/mm/yyyy hh:mm (por ejemplo,{" "}
                    {getCurrentDateExample()})
                  </p>
                  {expirationDate && !isValidExpirationDate(expirationDate) && (
                    <p className="mt-1.5 text-sm text-red-500">
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
                className="btn-primary w-full py-3"
              >
                {isLoading ? "Procesando..." : "Acortar URL"}
              </button>
            </form>

            {error && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {result && (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white text-xs">
                    ✓
                  </span>
                  {result.reused
                    ? "Ya tenías este enlace — reutilizado"
                    : "¡URL acortada con éxito!"}
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:underline font-medium break-all"
                  >
                    {result.shortUrl}
                  </a>
                  <button
                    onClick={copyShortUrl}
                    className="btn-secondary shrink-0"
                    title="Copiar al portapapeles"
                  >
                    {copied ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr/${result.id}`}
                    alt="Código QR del enlace"
                    width={132}
                    height={132}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
                  />
                  <div className="space-y-2 text-sm">
                    <a
                      href={`/api/qr/${result.id}`}
                      download={`qr-${result.id}.png`}
                      className="inline-block font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Descargar código QR
                    </a>
                    {session ? (
                      <Link
                        href={`/stats/${result.id}`}
                        className="block font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Ver estadísticas del enlace →
                      </Link>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        <Link
                          href="/login"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
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

          {/* Feature highlights */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
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

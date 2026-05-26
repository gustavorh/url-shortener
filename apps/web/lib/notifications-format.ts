import type { NotificationType } from "@/models/notification";

// Pretty-prints a notification for the UI. Kept dependency-free (no date-fns)
// so it works in both client components and server routes.

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
  ["second", 1000],
];

export function relativeTimeEs(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const diff = date.getTime() - Date.now();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(0, "second");
}

function linkLabel(payload: Record<string, unknown>): string {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (title) return title;
  const id = typeof payload.linkId === "string" ? payload.linkId : "";
  if (id) return `/${id}`;
  return "el enlace";
}

export function formatNotification(
  type: NotificationType,
  payload: Record<string, unknown>
): string {
  switch (type) {
    case "link.expiring_soon":
      return `El enlace "${linkLabel(payload)}" expira en menos de 24 horas.`;
    case "link.expired":
      return `El enlace "${linkLabel(payload)}" ha expirado.`;
    case "link.limit_reached": {
      const max = typeof payload.maxClicks === "number" ? payload.maxClicks : null;
      const suffix = max != null ? ` (límite de ${max} clics)` : "";
      return `El enlace "${linkLabel(payload)}" alcanzó su límite de clics${suffix}.`;
    }
    case "weekly.digest": {
      const total = typeof payload.totalClicks === "number" ? payload.totalClicks : 0;
      return `Resumen semanal: ${total} clic${total === 1 ? "" : "s"} en tus enlaces.`;
    }
    default:
      return "Notificación";
  }
}

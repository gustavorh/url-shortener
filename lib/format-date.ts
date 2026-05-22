import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/** Human-friendly relative time in Spanish, e.g. "hace 3 días". */
export function relativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: es,
  });
}

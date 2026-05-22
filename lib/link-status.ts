export type LinkStatus =
  | "active"
  | "disabled"
  | "scheduled"
  | "expired"
  | "limit";

export interface LinkStatusInput {
  disabled?: boolean | null;
  activeFrom?: Date | string | null;
  expirationDate?: Date | string | null;
  maxClicks?: number | null;
}

/**
 * Derives a link's effective state from its configuration and click count.
 * Checked in priority order: paused → not-yet-active → expired → limit hit.
 */
export function linkStatus(
  link: LinkStatusInput,
  clicks: number,
  now: Date = new Date()
): LinkStatus {
  if (link.disabled) return "disabled";
  if (link.activeFrom && now < new Date(link.activeFrom)) return "scheduled";
  if (link.expirationDate && now > new Date(link.expirationDate)) {
    return "expired";
  }
  if (link.maxClicks != null && clicks >= link.maxClicks) return "limit";
  return "active";
}

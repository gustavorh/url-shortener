import { UAParser } from "ua-parser-js";

export type DeviceKind = "ios" | "android" | "desktop";

export interface TargetRule {
  url: string;
  kind: "device" | "rotation";
  device?: string | null;
}

/** Classifies the visitor device from a User-Agent string. */
export function detectDevice(userAgent: string): DeviceKind {
  const os = new UAParser(userAgent || "").getOS().name?.toLowerCase() ?? "";
  if (os.includes("ios")) return "ios";
  if (os.includes("android")) return "android";
  return "desktop";
}

export interface ChosenDestination {
  url: string;
  reason: "device" | "rotation" | "default";
}

/**
 * Picks the destination for a click. Priority:
 *   1. a device-specific override matching the visitor's device,
 *   2. uniform A/B rotation across the base URL and rotation variants,
 *   3. the base URL.
 * `random` is injectable so the rotation branch is deterministically testable.
 */
export function chooseDestination(
  baseUrl: string,
  targets: TargetRule[],
  userAgent: string,
  random: () => number = Math.random
): ChosenDestination {
  const device = detectDevice(userAgent);
  const deviceTarget = targets.find(
    (target) => target.kind === "device" && target.device === device
  );
  if (deviceTarget) {
    return { url: deviceTarget.url, reason: "device" };
  }

  const rotation = targets.filter((target) => target.kind === "rotation");
  if (rotation.length > 0) {
    const pool = [baseUrl, ...rotation.map((target) => target.url)];
    const index = Math.min(
      Math.floor(random() * pool.length),
      pool.length - 1
    );
    return { url: pool[index], reason: "rotation" };
  }

  return { url: baseUrl, reason: "default" };
}

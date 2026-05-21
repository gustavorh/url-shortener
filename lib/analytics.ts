import { UAParser } from "ua-parser-js";
import { Click } from "@/models";
import { resolveClientIp } from "./request-ip";

/**
 * Records a click on a short link. Fire-and-forget: any failure is swallowed
 * so it never adds latency to — or breaks — the redirect itself.
 */
export async function recordClick(
  headers: Headers,
  urlId: string
): Promise<void> {
  try {
    const userAgent = headers.get("user-agent") || "";
    const parsed = new UAParser(userAgent).getResult();

    await Click.create({
      urlId,
      ip: resolveClientIp(headers),
      userAgent: userAgent || null,
      referrer: headers.get("referer") || null,
      // ua-parser-js leaves device.type empty for desktops.
      deviceType: parsed.device.type || "desktop",
      browser: parsed.browser.name || null,
      os: parsed.os.name || null,
    });
  } catch (error) {
    console.error(`Failed to record click for "${urlId}":`, error);
  }
}

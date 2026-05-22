import { UAParser } from "ua-parser-js";
import { Click } from "@/models";
import { resolveClientIp } from "./request-ip";
import { resolveCountry } from "./geo";
import { anonymizeIp } from "./anonymize-ip";
import { referrerDomain } from "./referrer";
import { metrics } from "./metrics";

/**
 * Records a click on a short link. Fire-and-forget: any failure is swallowed
 * so it never adds latency to — or breaks — the redirect itself.
 */
export async function recordClick(
  headers: Headers,
  urlId: string,
  targetUrl?: string | null
): Promise<void> {
  try {
    const userAgent = headers.get("user-agent") || "";
    const parsed = new UAParser(userAgent).getResult();
    // Resolve the country from the real IP, then store only an anonymized IP.
    const rawIp = resolveClientIp(headers);
    const country = resolveCountry(headers, rawIp);
    const referrer = headers.get("referer") || null;

    await Click.create({
      urlId,
      ip: anonymizeIp(rawIp),
      userAgent: userAgent || null,
      referrer,
      referrerDomain: referrerDomain(referrer),
      country,
      // ua-parser-js leaves device.type empty for desktops.
      deviceType: parsed.device.type || "desktop",
      browser: parsed.browser.name || null,
      os: parsed.os.name || null,
      targetUrl: targetUrl ?? null,
    });
    metrics.clicksRecorded.inc();
  } catch (error) {
    console.error(`Failed to record click for "${urlId}":`, error);
  }
}

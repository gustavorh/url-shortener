import { UAParser } from "ua-parser-js";
import { Click } from "@/models";
import { resolveClientIp } from "./request-ip";
import { resolveCountry } from "./geo";
import { anonymizeIp } from "./anonymize-ip";
import { referrerDomain } from "./referrer";
import { metrics } from "./metrics";
import { enqueueClick, type ClickJobData } from "./queue";

/**
 * Builds a serializable payload describing a click — used by both the queue
 * producer and the synchronous fallback so the two paths stay in lockstep.
 */
export function buildClickPayload(
  headers: Headers,
  urlId: string,
  targetUrl?: string | null
): ClickJobData {
  const rawIp = resolveClientIp(headers);
  return {
    urlId,
    targetUrl: targetUrl ?? null,
    userAgent: headers.get("user-agent") || null,
    referrer: headers.get("referer") || null,
    rawIp,
    country: resolveCountry(headers, rawIp),
    timestamp: Date.now(),
  };
}

/**
 * Writes a click to MySQL. Used directly by the BullMQ worker and by the
 * synchronous fallback when the queue is unavailable. Any failure is
 * swallowed so the caller (or BullMQ retries) decides what to do.
 */
export async function recordClickSync(payload: ClickJobData): Promise<void> {
  try {
    const parsed = payload.userAgent
      ? new UAParser(payload.userAgent).getResult()
      : null;

    await Click.create({
      urlId: payload.urlId,
      ip: anonymizeIp(payload.rawIp),
      userAgent: payload.userAgent,
      referrer: payload.referrer,
      referrerDomain: referrerDomain(payload.referrer),
      country: payload.country,
      deviceType: parsed?.device.type || "desktop",
      browser: parsed?.browser.name || null,
      os: parsed?.os.name || null,
      targetUrl: payload.targetUrl ?? null,
    });
    metrics.clicksRecorded.inc();
  } catch (error) {
    console.error(`Failed to record click for "${payload.urlId}":`, error);
    throw error;
  }
}

/**
 * Records a click on a short link. Tries the BullMQ queue first (keeps the
 * redirect path fast); falls back to a synchronous write when the queue is
 * unavailable. Fire-and-forget: failures never bubble up to the redirect.
 */
export async function trackClick(
  headers: Headers,
  urlId: string,
  targetUrl?: string | null
): Promise<void> {
  const payload = buildClickPayload(headers, urlId, targetUrl);

  const enqueued = await enqueueClick(payload);
  if (enqueued) return;

  // Queue unavailable — write directly so clicks are never lost.
  try {
    await recordClickSync(payload);
  } catch {
    /* recordClickSync already logged it */
  }
}

/**
 * Legacy entry point preserved for callers (the unlock route still imports
 * this). Delegates to trackClick — same behaviour, queue-first.
 */
export async function recordClick(
  headers: Headers,
  urlId: string,
  targetUrl?: string | null
): Promise<void> {
  return trackClick(headers, urlId, targetUrl);
}

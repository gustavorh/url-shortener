import crypto from "node:crypto";

// Signs and verifies outbound webhook bodies. Same scheme on both sides
// keeps the verification snippet in the README trivial.
//
// Wire format on the request:
//   X-Linkly-Signature: t=<unix-seconds>,v1=<hmac-sha256-hex>
//   X-Linkly-Event:     <event-name>
//   X-Linkly-Delivery:  <delivery-uuid>
//
// The signed string is `${t}.${rawBody}` so subscribers can reject
// replayed requests by comparing the timestamp to wall-clock time.

const SIGNATURE_VERSION = "v1";

export function buildSignatureHeader(
  body: string,
  secret: string,
  timestampSeconds = Math.floor(Date.now() / 1000)
): string {
  const payload = `${timestampSeconds}.${body}`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return `t=${timestampSeconds},${SIGNATURE_VERSION}=${hmac}`;
}

export interface VerifyOptions {
  /** Max allowed clock skew, in seconds. Defaults to 5 minutes. */
  toleranceSeconds?: number;
}

export function verifySignature(
  body: string,
  secret: string,
  header: string,
  options: VerifyOptions = {}
): boolean {
  const tolerance = options.toleranceSeconds ?? 300;
  const parts = parseSignatureHeader(header);
  if (!parts) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parts.timestamp) > tolerance) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parts.timestamp}.${body}`)
    .digest("hex");

  return timingSafeEqual(expected, parts.signature);
}

function parseSignatureHeader(
  header: string
): { timestamp: number; signature: string } | null {
  let timestamp: number | null = null;
  let signature: string | null = null;
  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=");
    if (key === "t" && value) timestamp = Number(value);
    else if (key === SIGNATURE_VERSION && value) signature = value;
  }
  if (timestamp === null || Number.isNaN(timestamp) || !signature) return null;
  return { timestamp, signature };
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Generates a webhook secret with `whsec_` prefix so users can recognize it
// at a glance. 32 random bytes → 64 hex chars; plenty of entropy for HMAC.
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

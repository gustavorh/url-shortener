import net from "node:net";
import { lookup } from "node:dns/promises";

// Only real web links may be shortened.
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/** Thrown for any invalid or unsafe URL. Message is safe to show users. */
export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

/**
 * Validates a user-supplied URL and returns it normalized. Adds an `https://`
 * scheme when missing and rejects anything that is not http/https.
 */
export function validateAndNormalizeUrl(input: string): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) {
    throw new UrlValidationError("La URL es obligatoria");
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new UrlValidationError("La URL no tiene un formato válido");
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new UrlValidationError("Solo se permiten enlaces http y https");
  }
  if (!url.hostname) {
    throw new UrlValidationError("La URL no tiene un host válido");
  }

  return url.toString();
}

function ipv4ToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let long = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    long = long * 256 + n;
  }
  return long >>> 0;
}

// Private, loopback, link-local and other non-routable IPv4 ranges.
const PRIVATE_V4_RANGES: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incl. cloud metadata 169.254.169.254)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

function inV4Range(ipLong: number, base: string, bits: number): boolean {
  const baseLong = ipv4ToLong(base);
  if (baseLong === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipLong & mask) === (baseLong & mask);
}

export function isPrivateIpv4(ip: string): boolean {
  const long = ipv4ToLong(ip);
  if (long === null) return false;
  return PRIVATE_V4_RANGES.some(([base, bits]) => inV4Range(long, base, bits));
}

export function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (/^f[cd]/.test(lower)) return true; // unique local fc00::/7
  if (/^fe[89ab]/.test(lower)) return true; // link-local fe80::/10
  const mapped = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

/** True for hostnames/IPs that must never be the target of a short link. */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local")) return true;
  if (net.isIPv4(host)) return isPrivateIpv4(host);
  if (net.isIPv6(host)) return isPrivateIpv6(host);
  return false;
}

/**
 * SSRF guard: rejects URLs that resolve to private/loopback/metadata
 * addresses. Note: this is a creation-time check and does not defend against
 * DNS rebinding (a domain that resolves to a public IP now and a private one
 * later) — a known limitation, acceptable while the server never fetches the
 * target itself.
 */
export async function assertNotSSRF(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (isBlockedHost(hostname)) {
    throw new UrlValidationError(
      "La URL apunta a una dirección de red no permitida"
    );
  }

  // For hostnames, resolve and re-check every returned address.
  if (net.isIP(hostname) === 0) {
    let resolved: { address: string; family: number }[];
    try {
      resolved = await lookup(hostname, { all: true });
    } catch {
      throw new UrlValidationError("No se pudo resolver el host de la URL");
    }
    for (const { address, family } of resolved) {
      const blocked =
        family === 6 ? isPrivateIpv6(address) : isPrivateIpv4(address);
      if (blocked) {
        throw new UrlValidationError(
          "La URL apunta a una dirección de red no permitida"
        );
      }
    }
  }
}

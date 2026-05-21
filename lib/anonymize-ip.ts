import net from "node:net";

/**
 * Anonymizes a client IP for GDPR-friendly storage: zeroes the last octet of
 * an IPv4 address and keeps only the first 48 bits of an IPv6 address. This
 * preserves coarse network/geo information without identifying a host.
 * Non-IP values (e.g. "unknown") are returned unchanged.
 */
export function anonymizeIp(ip: string): string {
  if (net.isIPv4(ip)) {
    const octets = ip.split(".");
    octets[3] = "0";
    return octets.join(".");
  }

  if (net.isIPv6(ip)) {
    const groups = ip.split(":").filter(Boolean).slice(0, 3);
    return `${groups.join(":")}::`;
  }

  return ip;
}

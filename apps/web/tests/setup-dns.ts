import { vi } from "vitest";

// The SSRF guard (lib/url-validation.ts → assertNotSSRF) resolves every
// hostname via DNS and rejects the ones that don't resolve. Integration tests
// use RFC 2606 / RFC 6761 reserved placeholder TLDs (.test, .example, .invalid)
// precisely because they must never resolve on the public internet — but that
// means they ENOTFOUND on clean DNS (CI), so the guard rejects them and link
// creation fails. (Locally they often "resolve" only because many ISP
// resolvers hijack NXDOMAIN and hand back a parking IP, which masks this.)
//
// These suites aren't testing the SSRF guard, so we resolve the reserved TLDs
// to a fixed public IP — the guard only blocks private/loopback/metadata
// addresses, so a public IP passes. Real hostnames still hit real DNS, and
// localhost/private hosts stay blocked (isBlockedHost runs before lookup).
vi.mock("node:dns/promises", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("node:dns/promises")>();
  const RESERVED = /\.(test|example|invalid)$/i;
  const lookup = (async (hostname: string, options?: unknown) => {
    if (typeof hostname === "string" && RESERVED.test(hostname)) {
      return [{ address: "93.184.216.34", family: 4 }];
    }
    return (actual.lookup as (h: string, o?: unknown) => unknown)(
      hostname,
      options
    );
  }) as typeof actual.lookup;
  return { ...actual, lookup };
});

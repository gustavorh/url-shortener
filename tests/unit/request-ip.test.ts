import { describe, it, expect } from "vitest";
import { resolveClientIp } from "@/lib/request-ip";

describe("resolveClientIp", () => {
  it("prefers true-client-ip over other headers", () => {
    const headers = new Headers({
      "true-client-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
    });
    expect(resolveClientIp(headers)).toBe("1.1.1.1");
  });

  it("uses the first hop of x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "3.3.3.3, 4.4.4.4, 5.5.5.5",
    });
    expect(resolveClientIp(headers)).toBe("3.3.3.3");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "6.6.6.6" });
    expect(resolveClientIp(headers)).toBe("6.6.6.6");
  });

  it("returns 'unknown' when no IP header is present", () => {
    expect(resolveClientIp(new Headers())).toBe("unknown");
  });
});

import { describe, it, expect } from "vitest";
import { anonymizeIp } from "@/lib/anonymize-ip";

describe("anonymizeIp", () => {
  it("zeroes the last octet of an IPv4 address", () => {
    expect(anonymizeIp("192.168.1.55")).toBe("192.168.1.0");
    expect(anonymizeIp("8.8.8.8")).toBe("8.8.8.0");
  });

  it("truncates an IPv6 address to its first groups", () => {
    expect(anonymizeIp("2606:4700:4700::1111")).toBe("2606:4700:4700::");
  });

  it("leaves non-IP values unchanged", () => {
    expect(anonymizeIp("unknown")).toBe("unknown");
    expect(anonymizeIp("")).toBe("");
  });
});

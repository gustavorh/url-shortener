import { describe, it, expect } from "vitest";
import {
  validateAndNormalizeUrl,
  UrlValidationError,
  isPrivateIpv4,
  isPrivateIpv6,
  isBlockedHost,
} from "@/lib/url-validation";

describe("validateAndNormalizeUrl", () => {
  it("adds https:// when the scheme is missing", () => {
    expect(validateAndNormalizeUrl("example.com")).toBe(
      "https://example.com/"
    );
  });

  it("keeps explicit http and https schemes", () => {
    expect(validateAndNormalizeUrl("http://example.com")).toBe(
      "http://example.com/"
    );
  });

  it("rejects an empty value", () => {
    expect(() => validateAndNormalizeUrl("   ")).toThrow(UrlValidationError);
  });

  it("rejects non-http(s) protocols", () => {
    expect(() => validateAndNormalizeUrl("ftp://example.com")).toThrow(
      UrlValidationError
    );
    expect(() => validateAndNormalizeUrl("javascript:alert(1)")).toThrow(
      UrlValidationError
    );
  });
});

describe("isPrivateIpv4", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "192.168.0.1",
    "172.16.5.5",
    "169.254.169.254", // cloud metadata endpoint
    "0.0.0.0",
  ])("flags %s as private", (ip) => {
    expect(isPrivateIpv4(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34"])(
    "allows public address %s",
    (ip) => {
      expect(isPrivateIpv4(ip)).toBe(false);
    }
  );
});

describe("isPrivateIpv6", () => {
  it("flags loopback, unique-local and link-local addresses", () => {
    expect(isPrivateIpv6("::1")).toBe(true);
    expect(isPrivateIpv6("fc00::1")).toBe(true);
    expect(isPrivateIpv6("fe80::abcd")).toBe(true);
  });

  it("flags IPv4-mapped private addresses", () => {
    expect(isPrivateIpv6("::ffff:127.0.0.1")).toBe(true);
  });

  it("allows public IPv6 addresses", () => {
    expect(isPrivateIpv6("2606:4700:4700::1111")).toBe(false);
  });
});

describe("isBlockedHost", () => {
  it("blocks localhost and private literal IPs", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("app.local")).toBe(true);
    expect(isBlockedHost("169.254.169.254")).toBe(true);
    expect(isBlockedHost("[::1]")).toBe(true);
  });

  it("allows ordinary public hostnames", () => {
    expect(isBlockedHost("example.com")).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { detectDevice, chooseDestination } from "@/lib/redirect-resolver";
import type { TargetRule } from "@/lib/redirect-resolver";

describe("detectDevice", () => {
  it("detects iOS", () => {
    expect(
      detectDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe("ios");
  });

  it("detects Android", () => {
    expect(
      detectDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36")
    ).toBe("android");
  });

  it("falls back to desktop", () => {
    expect(
      detectDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")
    ).toBe("desktop");
  });
});

describe("chooseDestination", () => {
  const base = "https://base.com";

  it("returns the base URL when there are no targets", () => {
    expect(chooseDestination(base, [], "")).toEqual({
      url: base,
      reason: "default",
    });
  });

  it("uses a device override matching the visitor", () => {
    const targets: TargetRule[] = [
      { url: "https://ios.example", kind: "device", device: "ios" },
    ];
    expect(
      chooseDestination(base, targets, "iPhone; CPU iPhone OS 17_0 like Mac")
    ).toEqual({ url: "https://ios.example", reason: "device" });
  });

  it("ignores a device override for a different device", () => {
    const targets: TargetRule[] = [
      { url: "https://ios.example", kind: "device", device: "ios" },
    ];
    expect(
      chooseDestination(base, targets, "Windows NT 10.0; Win64").reason
    ).toBe("default");
  });

  it("rotates uniformly across the base and variants", () => {
    const targets: TargetRule[] = [
      { url: "https://a.example", kind: "rotation", device: null },
      { url: "https://b.example", kind: "rotation", device: null },
    ];
    // pool = [base, a, b]
    expect(chooseDestination(base, targets, "", () => 0).url).toBe(base);
    expect(chooseDestination(base, targets, "", () => 0.5).url).toBe(
      "https://a.example"
    );
    expect(chooseDestination(base, targets, "", () => 0.99).url).toBe(
      "https://b.example"
    );
  });

  it("prefers a device override over rotation", () => {
    const targets: TargetRule[] = [
      { url: "https://ios.example", kind: "device", device: "ios" },
      { url: "https://a.example", kind: "rotation", device: null },
    ];
    expect(
      chooseDestination(base, targets, "iPhone; CPU iPhone OS 17_0", () => 0.9)
        .reason
    ).toBe("device");
  });
});

import { describe, it, expect } from "vitest";
import { linkStatus } from "@/lib/link-status";

const now = new Date("2026-05-22T12:00:00Z");
const past = new Date("2026-05-01T12:00:00Z");
const future = new Date("2026-06-01T12:00:00Z");

describe("linkStatus", () => {
  it("returns active for a plain link", () => {
    expect(linkStatus({}, 0, now)).toBe("active");
  });

  it("returns disabled when paused", () => {
    expect(linkStatus({ disabled: true }, 0, now)).toBe("disabled");
  });

  it("returns scheduled before the activation date", () => {
    expect(linkStatus({ activeFrom: future }, 0, now)).toBe("scheduled");
  });

  it("returns expired after the expiration date", () => {
    expect(linkStatus({ expirationDate: past }, 0, now)).toBe("expired");
  });

  it("returns limit once the click cap is reached", () => {
    expect(linkStatus({ maxClicks: 10 }, 10, now)).toBe("limit");
    expect(linkStatus({ maxClicks: 10 }, 9, now)).toBe("active");
  });

  it("prioritizes disabled over other states", () => {
    expect(
      linkStatus({ disabled: true, expirationDate: past }, 0, now)
    ).toBe("disabled");
  });
});

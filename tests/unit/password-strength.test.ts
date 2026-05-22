import { describe, it, expect } from "vitest";
import { scorePassword } from "@/lib/password-strength";

describe("scorePassword", () => {
  it("scores an empty password as the weakest", () => {
    expect(scorePassword("").score).toBe(0);
  });

  it("scores a short simple password low", () => {
    expect(scorePassword("abc").score).toBeLessThanOrEqual(1);
  });

  it("scores a long varied password as strong", () => {
    const result = scorePassword("Str0ng-Passw0rd!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("Fuerte");
  });

  it("never exceeds a score of 4", () => {
    expect(scorePassword("A".repeat(40) + "aaa1!").score).toBeLessThanOrEqual(
      4
    );
  });
});

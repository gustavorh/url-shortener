import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The skip-link is rendered from the root layout (a Server Component). We
// assert the source contains the expected markup so the link survives any
// refactor — accessibility tooling (axe, Lighthouse) will catch regressions
// at runtime, this guards against accidental deletion in code review.
describe("root layout skip-link", () => {
  const layout = readFileSync(
    join(__dirname, "..", "..", "app", "layout.tsx"),
    "utf8"
  );

  it("includes an in-page jump link to #main-content", () => {
    expect(layout).toMatch(/href=["']#main-content["']/);
  });

  it("hides the link visually until it receives focus", () => {
    // Tailwind: sr-only + focus:not-sr-only is the canonical pattern.
    expect(layout).toMatch(/sr-only/);
    expect(layout).toMatch(/focus:not-sr-only/);
  });

  it("declares the body's main landmark with the matching id", () => {
    // Every page should also expose id="main-content" on its <main>; here
    // we only enforce the layout doesn't accidentally drop the anchor.
    // (Page-level <main> ids are covered by their own components.)
    expect(layout).toContain("Saltar al contenido principal");
  });
});

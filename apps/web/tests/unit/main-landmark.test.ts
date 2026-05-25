import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Every user-facing page should expose its <main> landmark with the
// id the skip-link targets, otherwise focus jumps nowhere.
const PAGES = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/dashboard/page.tsx",
  "app/dashboard/profile/page.tsx",
  "app/dashboard/keys/page.tsx",
  "app/dashboard/import/page.tsx",
  "app/stats/[id]/page.tsx",
  "app/unlock/[id]/page.tsx",
  "app/u/[username]/page.tsx",
  "app/not-found.tsx",
  "app/error.tsx",
];

describe("main landmark", () => {
  const root = resolve(__dirname, "..", "..");

  for (const page of PAGES) {
    it(`${page} marks its <main> with id="main-content"`, () => {
      const source = readFileSync(join(root, page), "utf8");
      expect(source).toMatch(/<main[\s\S]*?id=["']main-content["']/);
    });
  }
});

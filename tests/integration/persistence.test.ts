import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { Sequelize } from "sequelize";

// Integration tests need a real MySQL database. They are opt-in: set
// INTEGRATION_DB=1 (and the DB_* env vars) to run them — see the CI workflow.
const runIntegration = process.env.INTEGRATION_DB === "1";

describe.skipIf(!runIntegration)("persistence (MySQL integration)", () => {
  let sequelize: Sequelize;
  let Url: typeof import("@/models").Url;
  let User: typeof import("@/models").User;
  let Click: typeof import("@/models").Click;
  let getLinkStats: typeof import("@/lib/stats-queries").getLinkStats;
  let getClickCounts: typeof import("@/lib/stats-queries").getClickCounts;
  let generateUniqueSlug: typeof import("@/lib/slug").generateUniqueSlug;

  beforeAll(async () => {
    // Point the DB layer at the isolated test database before importing it.
    process.env.DB_NAME = process.env.DB_NAME_TEST || "cortala_test";
    sequelize = (await import("@/lib/db")).default;

    const models = await import("@/models");
    Url = models.Url;
    User = models.User;
    Click = models.Click;

    const stats = await import("@/lib/stats-queries");
    getLinkStats = stats.getLinkStats;
    getClickCounts = stats.getClickCounts;
    generateUniqueSlug = (await import("@/lib/slug")).generateUniqueSlug;

    // A fresh schema for every run keeps tests independent.
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  it("persists a user-owned link with its clicks and aggregates them", async () => {
    const user = await User.create({
      id: randomUUID(),
      email: `user-${Date.now()}@test.local`,
      passwordHash: "hashed",
    });
    await Url.create({
      id: "track1",
      originalUrl: "https://example.com",
      userId: user.id,
    });
    await Click.bulkCreate([
      { urlId: "track1", deviceType: "mobile", browser: "Chrome", referrer: "https://t.co" },
      { urlId: "track1", deviceType: "desktop", browser: "Chrome", referrer: "https://t.co" },
      { urlId: "track1", deviceType: "desktop", browser: "Firefox", referrer: null },
    ]);

    const stats = await getLinkStats("track1");
    expect(stats.total).toBe(3);
    expect(stats.byDevice.find((d) => d.label === "desktop")?.count).toBe(2);
    expect(stats.byBrowser.find((b) => b.label === "Chrome")?.count).toBe(2);
    expect(stats.byDay.reduce((sum, day) => sum + day.count, 0)).toBe(3);
  });

  it("aggregates click counts across several links", async () => {
    await Url.create({ id: "track2", originalUrl: "https://other.com" });
    await Click.create({ urlId: "track2" });

    const counts = await getClickCounts(["track1", "track2", "missing"]);
    expect(counts.get("track1")).toBe(3);
    expect(counts.get("track2")).toBe(1);
    expect(counts.get("missing")).toBeUndefined();
  });

  it("generates slugs that do not collide with existing rows", async () => {
    const slug = await generateUniqueSlug(
      "https://unique.example",
      async (candidate) => (await Url.findByPk(candidate)) !== null
    );
    expect(slug).toHaveLength(5);
    expect(await Url.findByPk(slug)).toBeNull();
  });

  it("cascades click deletion when a link is removed", async () => {
    await Url.destroy({ where: { id: "track2" } });
    expect(await Click.count({ where: { urlId: "track2" } })).toBe(0);
  });
});

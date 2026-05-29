import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { Sequelize } from "sequelize";

// Integration coverage for link state (disabled, scheduled) and the
// date-ranged stats queries. Opt-in: set INTEGRATION_DB=1.
const runIntegration = process.env.INTEGRATION_DB === "1";

describe.skipIf(!runIntegration)("link lifecycle (MySQL integration)", () => {
  let sequelize: Sequelize;
  let models: typeof import("@/models");
  let createShortLink: typeof import("@/lib/link-service").createShortLink;
  let resolveLink: typeof import("@/lib/link-resolver").resolveLink;
  let getLinkStats: typeof import("@/lib/stats-queries").getLinkStats;
  let userId: string;

  beforeAll(async () => {
    process.env.DB_NAME = process.env.DB_NAME_TEST || "linkly_test";
    sequelize = (await import("@/lib/db")).default;
    models = await import("@/models");
    ({ createShortLink } = await import("@/lib/link-service"));
    ({ resolveLink } = await import("@/lib/link-resolver"));
    ({ getLinkStats } = await import("@/lib/stats-queries"));

    await sequelize.sync({ force: true });
    const user = await models.User.create({
      id: randomUUID(),
      email: `lifecycle-${Date.now()}@test.local`,
      passwordHash: "hashed",
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  it("reflects the disabled flag through resolveLink", async () => {
    const created = await createShortLink({
      originalUrl: "https://pause.example",
      userId,
    });
    await models.Url.update(
      { disabled: true },
      { where: { id: created.id } }
    );
    const resolved = await resolveLink(created.id);
    expect(resolved?.disabled).toBe(true);
  });

  it("exposes the scheduled activation date through resolveLink", async () => {
    const activeFrom = new Date("2099-01-01T00:00:00Z");
    const created = await createShortLink({
      originalUrl: "https://soon.example",
      activeFrom,
      userId,
    });
    const resolved = await resolveLink(created.id);
    expect(resolved?.activeFrom).toBe(activeFrom.toISOString());
  });

  it("scopes getLinkStats to the requested time window", async () => {
    const created = await createShortLink({
      originalUrl: "https://ranged.example",
      userId,
    });
    await models.Click.bulkCreate([
      { urlId: created.id, timestamp: new Date("2026-01-01T00:00:00Z") },
      { urlId: created.id, timestamp: new Date("2026-05-21T00:00:00Z") },
      { urlId: created.id, timestamp: new Date("2026-05-22T00:00:00Z") },
    ]);

    const all = await getLinkStats(created.id);
    expect(all.total).toBe(3);

    const since = new Date("2026-05-01T00:00:00Z");
    const recent = await getLinkStats(created.id, since);
    expect(recent.total).toBe(2);
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { Sequelize } from "sequelize";

// Integration coverage for password protection, click limits and the
// duplicate-link reuse behaviour. Opt-in: set INTEGRATION_DB=1.
const runIntegration = process.env.INTEGRATION_DB === "1";

describe.skipIf(!runIntegration)("link options (MySQL integration)", () => {
  let sequelize: Sequelize;
  let models: typeof import("@/models");
  let createShortLink: typeof import("@/lib/link-service").createShortLink;
  let resolveLink: typeof import("@/lib/link-resolver").resolveLink;
  let userId: string;

  beforeAll(async () => {
    process.env.DB_NAME = process.env.DB_NAME_TEST || "linkly_test";
    sequelize = (await import("@/lib/db")).default;
    models = await import("@/models");
    ({ createShortLink } = await import("@/lib/link-service"));
    ({ resolveLink } = await import("@/lib/link-resolver"));

    await sequelize.sync({ force: true });
    const user = await models.User.create({
      id: randomUUID(),
      email: `options-${Date.now()}@test.local`,
      passwordHash: "hashed",
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  it("stores a hashed password and marks the link protected", async () => {
    const created = await createShortLink({
      originalUrl: "https://secret.example",
      password: "s3cret",
      userId,
    });
    const row = await models.Url.findByPk(created.id);
    expect(row?.passwordHash).toBeTruthy();
    expect(row?.passwordHash).not.toBe("s3cret");

    const resolved = await resolveLink(created.id);
    expect(resolved?.passwordProtected).toBe(true);
  });

  it("persists a click limit and exposes it via resolveLink", async () => {
    const created = await createShortLink({
      originalUrl: "https://limited.example",
      maxClicks: 5,
      userId,
    });
    const resolved = await resolveLink(created.id);
    expect(resolved?.maxClicks).toBe(5);
  });

  it("reuses an existing link instead of creating a duplicate", async () => {
    const first = await createShortLink({
      originalUrl: "https://repeat.example",
      userId,
    });
    expect(first.reused).toBe(false);

    const second = await createShortLink({
      originalUrl: "https://repeat.example",
      userId,
    });
    expect(second.reused).toBe(true);
    expect(second.id).toBe(first.id);
  });

  it("does not reuse links across different users", async () => {
    const other = await models.User.create({
      id: randomUUID(),
      email: `other-${Date.now()}@test.local`,
      passwordHash: "hashed",
    });
    const a = await createShortLink({
      originalUrl: "https://shared.example",
      userId,
    });
    const b = await createShortLink({
      originalUrl: "https://shared.example",
      userId: other.id,
    });
    expect(b.reused).toBe(false);
    expect(b.id).not.toBe(a.id);
  });
});

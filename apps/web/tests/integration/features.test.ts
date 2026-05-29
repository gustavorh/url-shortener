import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { Sequelize } from "sequelize";
import type { NextRequest } from "next/server";

// Integration coverage for the link service, soft delete and API-key auth.
// Opt-in: set INTEGRATION_DB=1 with the DB_* env vars (see the CI workflow).
const runIntegration = process.env.INTEGRATION_DB === "1";

describe.skipIf(!runIntegration)("features (MySQL integration)", () => {
  let sequelize: Sequelize;
  let models: typeof import("@/models");
  let createShortLink: typeof import("@/lib/link-service").createShortLink;
  let LinkCreationError: typeof import("@/lib/link-service").LinkCreationError;
  let resolveLink: typeof import("@/lib/link-resolver").resolveLink;
  let authenticateApiKey: typeof import("@/lib/api-auth").authenticateApiKey;
  let generateApiKey: typeof import("@/lib/api-key").generateApiKey;
  let userId: string;

  beforeAll(async () => {
    process.env.DB_NAME = process.env.DB_NAME_TEST || "linkly_test";
    sequelize = (await import("@/lib/db")).default;
    models = await import("@/models");
    ({ createShortLink, LinkCreationError } = await import(
      "@/lib/link-service"
    ));
    ({ resolveLink } = await import("@/lib/link-resolver"));
    ({ authenticateApiKey } = await import("@/lib/api-auth"));
    ({ generateApiKey } = await import("@/lib/api-key"));

    await sequelize.sync({ force: true });
    const user = await models.User.create({
      id: randomUUID(),
      email: `features-${Date.now()}@test.local`,
      passwordHash: "hashed",
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  describe("createShortLink", () => {
    it("creates a link owned by the user with a generated slug", async () => {
      const created = await createShortLink({
        originalUrl: "https://example.com/page",
        userId,
      });
      expect(created.id).toHaveLength(5);
      const row = await models.Url.findByPk(created.id);
      expect(row?.userId).toBe(userId);
    });

    it("honors a custom alias and rejects a duplicate with 409", async () => {
      await createShortLink({
        originalUrl: "https://example.com",
        customAlias: "mi-alias",
        userId,
      });
      await expect(
        createShortLink({
          originalUrl: "https://other.com",
          customAlias: "mi-alias",
          userId,
        })
      ).rejects.toMatchObject({ status: 409 });
    });

    it("rejects SSRF destinations", async () => {
      await expect(
        createShortLink({ originalUrl: "http://localhost/admin", userId })
      ).rejects.toBeInstanceOf(LinkCreationError);
    });
  });

  describe("resolveLink", () => {
    it("returns the link together with its targets", async () => {
      const created = await createShortLink({
        originalUrl: "https://target.test",
        userId,
      });
      await models.LinkTarget.create({
        urlId: created.id,
        url: "https://ios.test",
        kind: "device",
        device: "ios",
      });
      const resolved = await resolveLink(created.id);
      expect(resolved?.targets).toHaveLength(1);
      expect(resolved?.targets[0].device).toBe("ios");
    });

    it("treats soft-deleted links as not found", async () => {
      const created = await createShortLink({
        originalUrl: "https://gone.test",
        userId,
      });
      await models.Url.update(
        { deletedAt: new Date() },
        { where: { id: created.id } }
      );
      expect(await resolveLink(created.id)).toBeNull();
    });
  });

  describe("authenticateApiKey", () => {
    const bearerRequest = (token: string | null): NextRequest => {
      const headers = new Headers();
      if (token) headers.set("authorization", `Bearer ${token}`);
      return { headers } as unknown as NextRequest;
    };

    it("accepts a valid key and rejects unknown, missing and revoked keys", async () => {
      const valid = generateApiKey();
      await models.ApiKey.create({
        id: randomUUID(),
        userId,
        name: "active",
        keyHash: valid.hash,
        prefix: valid.prefix,
      });
      expect(await authenticateApiKey(bearerRequest(valid.key))).toBe(userId);
      expect(await authenticateApiKey(bearerRequest("crtl_wrong"))).toBeNull();
      expect(await authenticateApiKey(bearerRequest(null))).toBeNull();

      const revoked = generateApiKey();
      await models.ApiKey.create({
        id: randomUUID(),
        userId,
        name: "revoked",
        keyHash: revoked.hash,
        prefix: revoked.prefix,
        revokedAt: new Date(),
      });
      expect(await authenticateApiKey(bearerRequest(revoked.key))).toBeNull();
    });
  });
});

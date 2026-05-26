import { describe, it, expect } from "vitest";
import {
  NotificationTypeSchema,
  NotificationSchema,
  NotificationListQuerySchema,
} from "@/lib/schemas/notifications";

describe("notifications zod schemas", () => {
  it("accepts every known notification type", () => {
    for (const type of [
      "link.expiring_soon",
      "link.limit_reached",
      "link.expired",
      "weekly.digest",
    ] as const) {
      expect(NotificationTypeSchema.parse(type)).toBe(type);
    }
  });

  it("rejects unknown notification types", () => {
    expect(NotificationTypeSchema.safeParse("link.something_else").success).toBe(
      false
    );
  });

  it("NotificationSchema accepts a fully populated record", () => {
    const parsed = NotificationSchema.parse({
      id: "n1",
      userId: "u1",
      type: "link.expiring_soon",
      payload: { linkId: "abc", title: "test" },
      readAt: null,
      createdAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
    });
    expect(parsed.id).toBe("n1");
    expect(parsed.type).toBe("link.expiring_soon");
  });

  it("NotificationSchema rejects an empty payload that is not an object", () => {
    expect(
      NotificationSchema.safeParse({
        id: "n1",
        userId: "u1",
        type: "link.expired",
        payload: "not-an-object",
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).success
    ).toBe(false);
  });

  it("NotificationListQuerySchema coerces numeric query params and applies defaults", () => {
    const parsed = NotificationListQuerySchema.parse({
      limit: "50",
      offset: "10",
      unread: "1",
    });
    expect(parsed).toEqual({ limit: 50, offset: 10, unread: "1" });

    const defaults = NotificationListQuerySchema.parse({});
    expect(defaults.limit).toBe(20);
    expect(defaults.offset).toBe(0);
    expect(defaults.unread).toBeUndefined();
  });

  it("NotificationListQuerySchema rejects out-of-range limit", () => {
    expect(NotificationListQuerySchema.safeParse({ limit: "9999" }).success).toBe(
      false
    );
    expect(NotificationListQuerySchema.safeParse({ limit: "0" }).success).toBe(
      false
    );
  });
});

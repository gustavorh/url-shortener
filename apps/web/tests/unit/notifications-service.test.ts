import { describe, it, expect, vi, beforeEach } from "vitest";

// We mock the Sequelize model so the service can be exercised without a real
// DB connection — same approach the rest of the unit suite uses.

const create = vi.fn();
const update = vi.fn();
const findAll = vi.fn();
const count = vi.fn();

vi.mock("@/models", () => ({
  Notification: {
    create,
    update,
    findAll,
    count,
  },
}));

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  findAll.mockReset();
  count.mockReset();
});

describe("lib/notifications-service", () => {
  it("createNotification inserts a row, generates an id and bumps the metric", async () => {
    create.mockResolvedValueOnce({ id: "row-1" });
    const { createNotification } = await import("@/lib/notifications-service");
    const { metrics } = await import("@/lib/metrics");
    const before = (await metrics.notificationsSent.get()).values.find(
      (v) => v.labels.type === "link.expiring_soon"
    )?.value ?? 0;

    await createNotification({
      userId: "user-1",
      type: "link.expiring_soon",
      payload: { linkId: "abc" },
    });

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0];
    expect(arg.userId).toBe("user-1");
    expect(arg.type).toBe("link.expiring_soon");
    expect(arg.payload).toEqual({ linkId: "abc" });
    expect(typeof arg.id).toBe("string");
    expect(arg.id.length).toBeGreaterThanOrEqual(8);

    const after = (await metrics.notificationsSent.get()).values.find(
      (v) => v.labels.type === "link.expiring_soon"
    )?.value ?? 0;
    expect(after).toBe(before + 1);
  });

  it("markAsRead scopes by userId and returns true when a row was updated", async () => {
    update.mockResolvedValueOnce([1]);
    const { markAsRead } = await import("@/lib/notifications-service");

    const ok = await markAsRead("notif-1", "user-1");

    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
    const [values, options] = update.mock.calls[0];
    expect(values.readAt).toBeInstanceOf(Date);
    expect(options.where).toEqual({
      id: "notif-1",
      userId: "user-1",
      readAt: null,
    });
  });

  it("markAsRead returns false when nothing was updated", async () => {
    update.mockResolvedValueOnce([0]);
    const { markAsRead } = await import("@/lib/notifications-service");
    expect(await markAsRead("missing", "user-1")).toBe(false);
  });

  it("markAllAsRead returns the number of updated rows", async () => {
    update.mockResolvedValueOnce([3]);
    const { markAllAsRead } = await import("@/lib/notifications-service");
    expect(await markAllAsRead("user-1")).toBe(3);
    const [, options] = update.mock.calls[0];
    expect(options.where).toEqual({ userId: "user-1", readAt: null });
  });

  it("listNotifications filters unread when requested and clamps limit", async () => {
    findAll.mockResolvedValueOnce([]);
    const { listNotifications } = await import("@/lib/notifications-service");

    await listNotifications("user-1", { unread: true, limit: 500, offset: 10 });

    expect(findAll).toHaveBeenCalledTimes(1);
    const opts = findAll.mock.calls[0][0];
    expect(opts.where).toEqual({ userId: "user-1", readAt: null });
    expect(opts.limit).toBe(100); // clamped from 500
    expect(opts.offset).toBe(10);
    expect(opts.order).toEqual([["createdAt", "DESC"]]);
  });

  it("listNotifications omits readAt filter when unread is false", async () => {
    findAll.mockResolvedValueOnce([]);
    const { listNotifications } = await import("@/lib/notifications-service");

    await listNotifications("user-1", {});

    const opts = findAll.mock.calls[0][0];
    expect(opts.where).toEqual({ userId: "user-1" });
    expect(opts.limit).toBe(20);
    expect(opts.offset).toBe(0);
  });

  it("countUnread queries by userId and readAt null", async () => {
    count.mockResolvedValueOnce(7);
    const { countUnread } = await import("@/lib/notifications-service");
    expect(await countUnread("user-1")).toBe(7);
    expect(count.mock.calls[0][0].where).toEqual({
      userId: "user-1",
      readAt: null,
    });
  });

  it("createIfMissing skips duplicates for the same payload key", async () => {
    findAll.mockResolvedValueOnce([
      { id: "exists", payload: { linkId: "abc" } },
    ]);
    const { createIfMissing } = await import("@/lib/notifications-service");

    const result = await createIfMissing(
      {
        userId: "user-1",
        type: "link.expiring_soon",
        payload: { linkId: "abc" },
      },
      "linkId"
    );

    expect(result).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("createIfMissing creates a new row when none match the payload key", async () => {
    findAll.mockResolvedValueOnce([
      { id: "other", payload: { linkId: "different" } },
    ]);
    create.mockResolvedValueOnce({ id: "new" });
    const { createIfMissing } = await import("@/lib/notifications-service");

    const result = await createIfMissing(
      {
        userId: "user-1",
        type: "link.expiring_soon",
        payload: { linkId: "abc" },
      },
      "linkId"
    );

    expect(result).not.toBeNull();
    expect(create).toHaveBeenCalledTimes(1);
  });
});

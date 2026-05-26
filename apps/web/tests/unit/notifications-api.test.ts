import { describe, it, expect, vi, beforeEach } from "vitest";

const getCurrentUserId = vi.fn();
const countUnread = vi.fn();
const markAllAsRead = vi.fn();
const markAsRead = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({ getCurrentUserId }));
vi.mock("@/lib/notifications-service", () => ({
  countUnread,
  markAllAsRead,
  markAsRead,
  listNotifications: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  getCurrentUserId.mockReset();
  countUnread.mockReset();
  markAllAsRead.mockReset();
  markAsRead.mockReset();
});

describe("GET /api/notifications/count", () => {
  it("returns 401 when there is no session", async () => {
    getCurrentUserId.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/notifications/count/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the unread count for the current user", async () => {
    getCurrentUserId.mockResolvedValueOnce("user-1");
    countUnread.mockResolvedValueOnce(5);
    const { GET } = await import("@/app/api/notifications/count/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ unread: 5 });
    expect(countUnread).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/notifications/read-all", () => {
  it("returns 401 when there is no session", async () => {
    getCurrentUserId.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/notifications/read-all/route");
    const res = await POST();
    expect(res.status).toBe(401);
    expect(markAllAsRead).not.toHaveBeenCalled();
  });

  it("marks all as read for the current user", async () => {
    getCurrentUserId.mockResolvedValueOnce("user-1");
    markAllAsRead.mockResolvedValueOnce(4);
    const { POST } = await import("@/app/api/notifications/read-all/route");
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updated: 4 });
    expect(markAllAsRead).toHaveBeenCalledWith("user-1");
  });
});

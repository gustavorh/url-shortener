import { randomUUID } from "node:crypto";
import { Notification } from "@/models";
import { metrics } from "./metrics";
import type {
  NotificationType,
  NotificationPayload,
} from "@/models/notification";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
}

export interface ListNotificationsOptions {
  unread?: boolean;
  limit?: number;
  offset?: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const created = await Notification.create({
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    payload: input.payload,
  });
  metrics.notificationsSent.inc({ type: input.type });
  return created;
}

export async function markAsRead(
  id: string,
  userId: string
): Promise<boolean> {
  const [count] = await Notification.update(
    { readAt: new Date() },
    { where: { id, userId, readAt: null } }
  );
  return count > 0;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const [count] = await Notification.update(
    { readAt: new Date() },
    { where: { userId, readAt: null } }
  );
  return count;
}

export async function listNotifications(
  userId: string,
  options: ListNotificationsOptions = {}
): Promise<Notification[]> {
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  const offset = Math.max(0, options.offset ?? 0);
  const where: Record<string, unknown> = { userId };
  if (options.unread) {
    where.readAt = null;
  }
  return Notification.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
}

export async function countUnread(userId: string): Promise<number> {
  return Notification.count({ where: { userId, readAt: null } });
}

// Idempotent creator. Used by the periodic worker to avoid duplicating
// a notification for the same (user, type, link) tuple. payloadKey identifies
// the canonical resource (typically the link id) inside payload.
export async function createIfMissing(
  input: CreateNotificationInput,
  payloadKey: string
): Promise<Notification | null> {
  const key = String(input.payload?.[payloadKey] ?? "");
  if (!key) {
    return createNotification(input);
  }
  const existing = await Notification.findAll({
    where: { userId: input.userId, type: input.type },
    attributes: ["id", "payload"],
    raw: true,
  });
  const dupe = existing.find(
    (row) =>
      String((row.payload as Record<string, unknown>)?.[payloadKey] ?? "") ===
      key
  );
  if (dupe) return null;
  return createNotification(input);
}

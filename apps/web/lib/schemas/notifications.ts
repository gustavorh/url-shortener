import { z } from "zod";

// Shared Zod schemas for the in-app notifications feature. The single-package
// project doesn't have a separate `@linkly/schemas` workspace, so we keep
// these next to the rest of the lib code instead.

export const NotificationTypeSchema = z.enum([
  "link.expiring_soon",
  "link.limit_reached",
  "link.expired",
  "weekly.digest",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  payload: z.record(z.string(), z.unknown()),
  readAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListQuerySchema = z.object({
  unread: z.union([z.literal("1"), z.literal("0")]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;

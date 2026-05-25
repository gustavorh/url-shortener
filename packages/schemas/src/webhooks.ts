// Webhook schemas. Lives in the shared package so the CLI and the upcoming
// browser extension can drive the webhook API with the same validation.

import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "link.created",
  "link.clicked",
  "link.expired",
  "link.limit_reached",
] as const;

export const WebhookEventSchema = z.enum(WEBHOOK_EVENTS);

export const CreateWebhookBodySchema = z.object({
  url: z.string().url("URL inválida"),
  events: z
    .array(WebhookEventSchema)
    .max(WEBHOOK_EVENTS.length)
    .optional()
    .default([]),
  description: z
    .string()
    .max(255)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  active: z.boolean().optional().default(true),
});

export const UpdateWebhookBodySchema = CreateWebhookBodySchema.partial();

export const WebhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  description: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  // Only present right after creation — subsequent reads omit it.
  secret: z.string().optional(),
});

export const WebhookDeliverySchema = z.object({
  id: z.string(),
  event: z.string(),
  status: z.enum(["pending", "success", "failed"]),
  attempts: z.number().int().nonnegative(),
  responseStatus: z.number().int().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type CreateWebhookBody = z.infer<typeof CreateWebhookBodySchema>;
export type UpdateWebhookBody = z.infer<typeof UpdateWebhookBodySchema>;
export type WebhookView = z.infer<typeof WebhookSchema>;
export type WebhookDeliveryView = z.infer<typeof WebhookDeliverySchema>;

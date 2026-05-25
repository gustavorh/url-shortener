// Zod schemas for the public REST API v1. Single source of truth for
// request validation, response shapes, and (later) OpenAPI generation.
// CLI and browser-extension clients also import from here so the wire
// format stays in lockstep across surfaces.

import { z } from "zod";

// ---------- Path / query params ----------

export const LinkIdParamSchema = z
  .string()
  .min(1, "id requerido")
  .max(64, "id demasiado largo");

export const ListLinksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined)),
  tag: z
    .string()
    .trim()
    .toLowerCase()
    .max(64)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

// ---------- Request bodies ----------

// Accepts either an ISO datetime or a plain date, and coerces to Date.
// Empty strings / null / undefined become null (an explicit "no value").
const optionalDate = z
  .union([z.string().datetime({ offset: true }), z.string().date(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null));

export const CreateLinkBodySchema = z.object({
  url: z.string().url("URL inválida"),
  customAlias: z
    .string()
    .min(1)
    .max(64)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  expirationDate: optionalDate,
  password: z
    .string()
    .min(1)
    .max(200)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  maxClicks: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  activeFrom: optionalDate,
});

// ---------- Response shapes ----------

// Dates leave the API as ISO strings or as raw Date instances depending on
// the JSON serializer; the schema accepts both so consumers can validate
// either form.
const ApiDate = z.union([z.string(), z.date()]);

export const LinkSummarySchema = z.object({
  id: z.string(),
  shortUrl: z.string(),
  originalUrl: z.string(),
  title: z.string().nullable(),
  tags: z.array(z.string()),
  clicks: z.number().int().nonnegative(),
  disabled: z.boolean(),
  expirationDate: ApiDate.nullable(),
  creationDate: ApiDate,
});

export const ListLinksResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  links: z.array(LinkSummarySchema),
});

export const LinkDetailSchema = LinkSummarySchema;

export const CreatedLinkSchema = z.object({
  id: z.string(),
  shortUrl: z.string(),
  originalUrl: z.string(),
  expirationDate: ApiDate.nullable(),
  creationDate: ApiDate,
});

export const LabeledCountSchema = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
});

export const DailyCountSchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
});

export const HourlyCountSchema = z.object({
  hour: z.number().int().min(0).max(23),
  count: z.number().int().nonnegative(),
});

export const LinkStatsResponseSchema = z.object({
  id: z.string(),
  total: z.number().int().nonnegative(),
  byDay: z.array(DailyCountSchema),
  byHour: z.array(HourlyCountSchema),
  topReferrers: z.array(LabeledCountSchema),
  byDevice: z.array(LabeledCountSchema),
  byBrowser: z.array(LabeledCountSchema),
  byCountry: z.array(LabeledCountSchema),
  byOs: z.array(LabeledCountSchema),
  byTarget: z.array(LabeledCountSchema),
});

export const MeResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  createdAt: ApiDate,
  links: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
});

// ---------- Inferred types ----------

// Request bodies use z.input — that's the wire shape consumers send
// (string dates, no defaults applied yet). Response types use z.infer.
export type CreateLinkBody = z.input<typeof CreateLinkBodySchema>;
export type ListLinksQuery = z.input<typeof ListLinksQuerySchema>;
export type LinkSummary = z.infer<typeof LinkSummarySchema>;
export type ListLinksResponse = z.infer<typeof ListLinksResponseSchema>;
export type LinkDetail = z.infer<typeof LinkDetailSchema>;
export type CreatedLink = z.infer<typeof CreatedLinkSchema>;
export type LinkStatsResponse = z.infer<typeof LinkStatsResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

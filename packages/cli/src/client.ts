// Tiny typed HTTP client for the Linkly REST API v1. Validates responses
// with the shared @linkly/schemas package so the CLI catches surface
// changes immediately instead of crashing later on missing fields.

import {
  CreateLinkBodySchema,
  CreatedLinkSchema,
  LinkDetailSchema,
  ListLinksResponseSchema,
  LinkStatsResponseSchema,
  MeResponseSchema,
  type CreateLinkBody,
  type CreatedLink,
  type LinkDetail,
  type ListLinksResponse,
  type LinkStatsResponse,
  type MeResponse,
} from "@linkly/schemas/v1";
import type { LinklyConfig } from "./config.js";

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function call<T>(
  cfg: LinklyConfig,
  method: string,
  path: string,
  body: unknown | undefined,
  validate: (data: unknown) => T
): Promise<T> {
  const url = new URL(path, cfg.baseUrl);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "linkly-cli",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Try to surface the API's own error message when present.
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* response not JSON; fall back to status */
    }
    throw new ApiError(res.status, message);
  }

  const data = (await res.json()) as unknown;
  return validate(data);
}

export const api = {
  async me(cfg: LinklyConfig): Promise<MeResponse> {
    return call(cfg, "GET", "/api/v1/me", undefined, (d) =>
      MeResponseSchema.parse(d)
    );
  },

  async createLink(cfg: LinklyConfig, body: CreateLinkBody): Promise<CreatedLink> {
    const parsed = CreateLinkBodySchema.parse(body);
    return call(cfg, "POST", "/api/v1/links", parsed, (d) =>
      CreatedLinkSchema.parse(d)
    );
  },

  async listLinks(
    cfg: LinklyConfig,
    query: { limit?: number; offset?: number; search?: string; tag?: string } = {}
  ): Promise<ListLinksResponse> {
    const params = new URLSearchParams();
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.offset !== undefined) params.set("offset", String(query.offset));
    if (query.search) params.set("search", query.search);
    if (query.tag) params.set("tag", query.tag);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return call(cfg, "GET", `/api/v1/links${qs}`, undefined, (d) =>
      ListLinksResponseSchema.parse(d)
    );
  },

  async getLink(cfg: LinklyConfig, id: string): Promise<LinkDetail> {
    return call(cfg, "GET", `/api/v1/links/${encodeURIComponent(id)}`, undefined, (d) =>
      LinkDetailSchema.parse(d)
    );
  },

  async getStats(cfg: LinklyConfig, id: string): Promise<LinkStatsResponse> {
    return call(
      cfg,
      "GET",
      `/api/v1/links/${encodeURIComponent(id)}/stats`,
      undefined,
      (d) => LinkStatsResponseSchema.parse(d)
    );
  },
};

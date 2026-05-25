// Same shape as the CLI's client (apps/cli/src/client.ts) but lives in
// the extension so both surfaces hit /api/v1/* with the same headers and
// validate responses through the shared @cortala/schemas package.

import {
  CreateLinkBodySchema,
  CreatedLinkSchema,
  MeResponseSchema,
  type CreateLinkBody,
  type CreatedLink,
  type MeResponse,
} from "@cortala/schemas/v1";
import type { ExtensionConfig } from "./storage";

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function call<T>(
  cfg: ExtensionConfig,
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
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, message);
  }
  const data = (await res.json()) as unknown;
  return validate(data);
}

export const api = {
  async verify(cfg: ExtensionConfig): Promise<MeResponse> {
    return call(cfg, "GET", "/api/v1/me", undefined, (d) =>
      MeResponseSchema.parse(d)
    );
  },
  async shorten(cfg: ExtensionConfig, body: CreateLinkBody): Promise<CreatedLink> {
    const parsed = CreateLinkBodySchema.parse(body);
    return call(cfg, "POST", "/api/v1/links", parsed, (d) =>
      CreatedLinkSchema.parse(d)
    );
  },
};

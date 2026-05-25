// Helpers for validating API requests with Zod and returning consistent
// 400 responses. Used by the v1 routes (and later the webhooks/bulk
// endpoints) so the error shape stays uniform across the public API.

import { NextResponse } from "next/server";
import type { z } from "zod";

export type ValidationFailure = {
  ok: false;
  response: NextResponse;
};

export type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// Returns the first issue with its path, e.g. "url: URL inválida".
// Keeps the response body tiny while still pointing at the bad field.
function formatIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Datos inválidos";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<ValidationResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: formatIssue(parsed.error) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

export function parseSearchParams<T>(
  params: URLSearchParams,
  schema: z.ZodType<T>
): ValidationResult<T> {
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) raw[key] = value;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: formatIssue(parsed.error) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

export function parsePathParam<T>(
  value: unknown,
  schema: z.ZodType<T>
): ValidationResult<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: formatIssue(parsed.error) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

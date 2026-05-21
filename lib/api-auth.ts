import type { NextRequest } from "next/server";
import { ApiKey } from "@/models";
import { hashApiKey } from "./api-key";

/**
 * Authenticates a public-API request via its `Authorization: Bearer <key>`
 * header. Returns the owning user's id, or null when the key is missing,
 * malformed, revoked or unknown.
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const key = header.slice("Bearer ".length).trim();
  if (!key) return null;

  const record = await ApiKey.findOne({
    where: { keyHash: hashApiKey(key), revokedAt: null },
  });
  if (!record) return null;

  // Best-effort usage timestamp; never blocks the request.
  record.update({ lastUsedAt: new Date() }).catch(() => {});

  return record.userId;
}

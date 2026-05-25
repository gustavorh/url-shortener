// POST /api/links/bulk/delete — soft-deletes the caller's links by id.
// Idempotent: returns the count of rows actually affected so the UI can
// surface a faithful "deleted N of M" message.

import type { NextRequest } from "next/server";
import { Url } from "@/models";
import { withBulkAuth, whereOwnedByUser } from "@/lib/bulk-actions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withBulkAuth(await request.json().catch(() => null), async ({ userId, ids }) => {
    const [affected] = await Url.update(
      { deletedAt: new Date() },
      { where: whereOwnedByUser(userId, ids) }
    );
    return { ok: true, affected };
  });
}

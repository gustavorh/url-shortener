// POST /api/links/bulk/disable — pauses the caller's links by id.

import type { NextRequest } from "next/server";
import { Url } from "@/models";
import { withBulkAuth, whereOwnedByUser } from "@/lib/bulk-actions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withBulkAuth(await request.json().catch(() => null), async ({ userId, ids }) => {
    const [affected] = await Url.update(
      { disabled: true },
      { where: whereOwnedByUser(userId, ids) }
    );
    return { ok: true, affected };
  });
}

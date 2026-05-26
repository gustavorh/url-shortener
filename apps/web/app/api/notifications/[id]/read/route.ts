import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { markAsRead } from "@/lib/notifications-service";

export const runtime = "nodejs";

// POST /api/notifications/[id]/read — marks one notification as read,
// scoped to the current user. Idempotent: already-read items return 200.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  await markAsRead(id, userId);
  return NextResponse.json({ ok: true });
}

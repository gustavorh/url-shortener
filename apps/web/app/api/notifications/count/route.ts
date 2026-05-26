import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { countUnread } from "@/lib/notifications-service";

export const runtime = "nodejs";

// GET /api/notifications/count — polled by the sidebar bell every 30s.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const unread = await countUnread(userId);
  return NextResponse.json({ unread });
}

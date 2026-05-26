import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { markAllAsRead } from "@/lib/notifications-service";

export const runtime = "nodejs";

// POST /api/notifications/read-all — bulk mark for the current user.
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const updated = await markAllAsRead(userId);
  return NextResponse.json({ updated });
}

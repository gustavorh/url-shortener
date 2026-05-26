import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { listNotifications } from "@/lib/notifications-service";
import { NotificationListQuerySchema } from "@/lib/schemas/notifications";

export const runtime = "nodejs";

// GET /api/notifications?unread=1&limit=20&offset=0 — paginated list scoped
// to the authenticated user.
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = NotificationListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const rows = await listNotifications(userId, {
    unread: parsed.data.unread === "1",
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  });
  return NextResponse.json({
    notifications: rows.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      payload: n.payload,
      readAt: n.readAt ?? null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
  });
}

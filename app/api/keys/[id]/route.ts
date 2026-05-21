import { NextRequest, NextResponse } from "next/server";
import { ApiKey } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";

// DELETE /api/keys/[id] — revokes one of the current user's API keys.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const record = await ApiKey.findOne({ where: { id, userId } });
  if (!record) {
    return NextResponse.json(
      { error: "Clave no encontrada" },
      { status: 404 }
    );
  }

  if (!record.revokedAt) {
    await record.update({ revokedAt: new Date() });
  }
  return NextResponse.json({ revoked: true });
}

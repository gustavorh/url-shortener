import { NextRequest, NextResponse } from "next/server";
import { Url, LinkTarget } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { invalidateLink } from "@/lib/link-resolver";

export const runtime = "nodejs";

// DELETE /api/links/[id]/targets/[targetId] — remove one target.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; targetId: string }> }
) {
  const { id, targetId } = await params;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const link = await Url.findByPk(id, { raw: true });
  if (!link || link.userId !== userId) {
    return NextResponse.json(
      { error: "Enlace no encontrado" },
      { status: 404 }
    );
  }

  await LinkTarget.destroy({ where: { id: targetId, urlId: id } });
  await invalidateLink(id);

  return NextResponse.json({ deleted: true });
}

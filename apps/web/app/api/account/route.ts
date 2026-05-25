// DELETE /api/account — permanently deletes the current user's account.
// Foreign-key cascades remove their links, clicks, targets and API keys.

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { User } from "@/models";

export const runtime = "nodejs";

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await User.destroy({ where: { id: userId } });
  return NextResponse.json({ deleted: true });
}

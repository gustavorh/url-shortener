// GET /api/account/export — downloads all of the current user's data (GDPR).

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { User, Url, Click, ApiKey, LinkTarget } from "@/models";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "name", "username", "bio", "createdAt"],
    raw: true,
  });
  const links = await Url.findAll({ where: { userId }, raw: true });
  const linkIds = links.map((link) => link.id);

  const clicks = linkIds.length
    ? await Click.findAll({ where: { urlId: linkIds }, raw: true })
    : [];
  const targets = linkIds.length
    ? await LinkTarget.findAll({ where: { urlId: linkIds }, raw: true })
    : [];
  const apiKeys = await ApiKey.findAll({
    where: { userId },
    attributes: ["id", "name", "prefix", "lastUsedAt", "revokedAt", "createdAt"],
    raw: true,
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    links,
    clicks,
    targets,
    apiKeys,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="linkly-export.json"',
    },
  });
}

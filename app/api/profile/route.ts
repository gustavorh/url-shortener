// Session-authenticated read/update of the current user's public profile.

import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";
import { z } from "zod";
import { User } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { isReservedSlug } from "@/lib/reserved-slugs";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

const updateSchema = z.object({
  name: z.string().trim().max(120).optional(),
  username: z.string().trim().max(32).optional(),
  bio: z.string().trim().max(500).optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const user = await User.findByPk(userId, {
    attributes: ["email", "name", "username", "bio"],
    raw: true,
  });
  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (parsed.data.name !== undefined) {
    updates.name = parsed.data.name || null;
  }
  if (parsed.data.bio !== undefined) {
    updates.bio = parsed.data.bio || null;
  }

  if (parsed.data.username !== undefined) {
    const username = parsed.data.username.trim();
    if (username) {
      if (!USERNAME_PATTERN.test(username)) {
        return NextResponse.json(
          {
            error:
              "El usuario debe tener 3-32 caracteres: letras, números, guion o guion bajo",
          },
          { status: 400 }
        );
      }
      if (isReservedSlug(username)) {
        return NextResponse.json(
          { error: "Ese nombre de usuario está reservado" },
          { status: 400 }
        );
      }
      const taken = await User.findOne({
        where: { username, id: { [Op.ne]: userId } },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Ese nombre de usuario ya está en uso" },
          { status: 409 }
        );
      }
      updates.username = username;
    } else {
      updates.username = null;
    }
  }

  await User.update(updates, { where: { id: userId } });
  return NextResponse.json({ ok: true });
}

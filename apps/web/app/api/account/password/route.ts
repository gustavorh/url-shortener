// PUT /api/account/password — changes the signed-in user's password.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // OAuth-only accounts have no local password — they can't change one
  // through this endpoint. (A future flow could let them set an initial
  // password; for now we point them at their provider.)
  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error: `Esta cuenta inicia sesión con ${user.provider ?? "un proveedor externo"} y no tiene contraseña local.`,
      },
      { status: 400 }
    );
  }

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!matches) {
    return NextResponse.json(
      { error: "La contraseña actual es incorrecta" },
      { status: 401 }
    );
  }

  await user.update({
    passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
  });
  return NextResponse.json({ ok: true });
}

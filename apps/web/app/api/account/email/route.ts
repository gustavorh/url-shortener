// PUT /api/account/email — changes the signed-in user's email address.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { z } from "zod";
import { User } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  currentPassword: z.string().min(1),
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

  // OAuth-only accounts can't pass the password gate that protects
  // email changes. They need to manage the email through their
  // provider's account settings, so we refuse here.
  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error: `Esta cuenta inicia sesión con ${user.provider ?? "un proveedor externo"}. Cambia el correo desde tu proveedor.`,
      },
      { status: 400 }
    );
  }

  // The password gate prevents email takeover from a hijacked session.
  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!matches) {
    return NextResponse.json(
      { error: "La contraseña es incorrecta" },
      { status: 401 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const taken = await User.findOne({
    where: { email, id: { [Op.ne]: userId } },
  });
  if (taken) {
    return NextResponse.json(
      { error: "Ese correo ya está en uso" },
      { status: 409 }
    );
  }

  await user.update({ email });
  return NextResponse.json({ ok: true });
}

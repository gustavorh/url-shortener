// Session-authenticated management of the current user's API keys.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiKey } from "@/models";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/api-key";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
});

// GET /api/keys — list the user's keys (never returns the secret).
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const keys = await ApiKey.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    attributes: [
      "id",
      "name",
      "prefix",
      "lastUsedAt",
      "revokedAt",
      "createdAt",
    ],
    raw: true,
  });
  return NextResponse.json({ keys });
}

// POST /api/keys — create a key; the plaintext secret is returned only here.
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { key, hash, prefix } = generateApiKey();
  const record = await ApiKey.create({
    id: randomUUID(),
    userId,
    name: parsed.data.name,
    keyHash: hash,
    prefix,
  });

  return NextResponse.json(
    {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      createdAt: record.createdAt,
      // Shown once — the user must copy it now.
      key,
    },
    { status: 201 }
  );
}

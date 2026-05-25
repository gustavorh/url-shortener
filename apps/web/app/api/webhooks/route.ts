// Session-authenticated webhook CRUD. Lists and creates webhooks for the
// signed-in user. Webhook deliveries live at /api/webhooks/[id]/deliveries.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { Webhook } from "@/models";
import { CreateWebhookBodySchema } from "@cortala/schemas/webhooks";
import { parseJsonBody } from "@/lib/api-validation";
import { generateWebhookSecret } from "@/lib/webhook-signer";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autenticado" }, { status: 401 });
}

function toView(w: {
  id: string;
  url: string;
  events: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
}) {
  return {
    id: w.id,
    url: w.url,
    events: w.events ? w.events.split(",").filter(Boolean) : [],
    description: w.description,
    active: w.active,
    createdAt: w.createdAt,
  };
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const rows = await Webhook.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    raw: true,
  });
  return NextResponse.json({ webhooks: rows.map(toView) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const parsed = await parseJsonBody(request, CreateWebhookBodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const secret = generateWebhookSecret();
  const created = await Webhook.create({
    id: randomUUID(),
    userId,
    url: body.url,
    secret,
    events: (body.events ?? []).join(","),
    active: body.active ?? true,
    description: body.description,
  });

  // Return the secret once — the UI surfaces it to the user immediately so
  // they can copy it into their verifying code. Subsequent GETs omit it.
  return NextResponse.json(
    {
      ...toView(created.get({ plain: true })),
      secret,
    },
    { status: 201 }
  );
}

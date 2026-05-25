import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Webhook } from "@/models";
import { UpdateWebhookBodySchema } from "@cortala/schemas/webhooks";
import { parseJsonBody } from "@/lib/api-validation";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "No autenticado" }, { status: 401 });
}

function notFound() {
  return NextResponse.json(
    { error: "Webhook no encontrado" },
    { status: 404 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const { id } = await params;
  const webhook = await Webhook.findByPk(id);
  if (!webhook || webhook.userId !== userId) return notFound();

  const parsed = await parseJsonBody(request, UpdateWebhookBodySchema);
  if (!parsed.ok) return parsed.response;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.url !== undefined) updates.url = parsed.data.url;
  if (parsed.data.events !== undefined)
    updates.events = (parsed.data.events ?? []).join(",");
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description;
  if (parsed.data.active !== undefined) updates.active = parsed.data.active;

  await webhook.update(updates);
  return NextResponse.json({
    id: webhook.id,
    url: webhook.url,
    events: webhook.events ? webhook.events.split(",").filter(Boolean) : [],
    description: webhook.description,
    active: webhook.active,
    createdAt: webhook.createdAt,
  });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const { id } = await params;
  const webhook = await Webhook.findByPk(id);
  if (!webhook || webhook.userId !== userId) return notFound();

  await webhook.destroy();
  return NextResponse.json({ ok: true });
}

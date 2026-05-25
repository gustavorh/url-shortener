// Last N delivery attempts for a webhook, newest first. Used by the
// dashboard webhooks page to surface recent failures.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Webhook, WebhookDelivery } from "@/models";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const webhook = await Webhook.findByPk(id, { raw: true });
  if (!webhook || webhook.userId !== userId) {
    return NextResponse.json(
      { error: "Webhook no encontrado" },
      { status: 404 }
    );
  }

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const rows = await WebhookDelivery.findAll({
    where: { webhookId: id },
    order: [["createdAt", "DESC"]],
    limit,
    raw: true,
  });

  return NextResponse.json({
    deliveries: rows.map((d) => ({
      id: d.id,
      event: d.event,
      status: d.status,
      attempts: d.attempts,
      responseStatus: d.responseStatus,
      lastError: d.lastError,
      createdAt: d.createdAt,
    })),
  });
}

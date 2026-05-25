// Fires a one-off test event to the webhook so users can verify their
// endpoint without waiting for a real link.created event.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Webhook } from "@/models";
import { emitTestEvent } from "@/lib/webhook-emitter";

export const runtime = "nodejs";

export async function POST(
  _: NextRequest,
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

  const deliveryId = await emitTestEvent(id);
  if (!deliveryId) {
    return NextResponse.json(
      { error: "No se pudo enviar el evento de prueba" },
      { status: 500 }
    );
  }
  return NextResponse.json({ deliveryId });
}

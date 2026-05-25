import { randomUUID } from "node:crypto";
import { Op } from "sequelize";
import { Webhook, WebhookDelivery } from "@/models";
import { enqueueWebhookDelivery } from "./queue";
import { metrics } from "./metrics";

// High-level API for emitting webhook events. Looks up every active
// subscription for the user that matches the event, persists a delivery
// row, and enqueues a BullMQ job. Callers fire and forget — failures are
// logged but never propagated, because event emission must not break the
// caller's primary flow (creating a link, recording a click, etc).

export type WebhookEvent =
  | "link.created"
  | "link.clicked"
  | "link.expired"
  | "link.limit_reached";

// "" in the events column means "all events", so we OR against that too.
function eventMatches(subscribed: string, event: WebhookEvent): boolean {
  if (!subscribed) return true; // empty list = all events
  const list = subscribed.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(event);
}

export interface EmitOptions {
  userId: string;
  event: WebhookEvent;
  payload: unknown;
}

export async function emitWebhookEvent(options: EmitOptions): Promise<void> {
  try {
    const subscribers = await Webhook.findAll({
      where: { userId: options.userId, active: true },
      raw: true,
    });

    const matching = subscribers.filter((w) =>
      eventMatches(w.events, options.event)
    );
    if (matching.length === 0) return;

    const enqueuedAt = Date.now();
    await Promise.all(
      matching.map(async (w) => {
        const delivery = await WebhookDelivery.create({
          id: randomUUID(),
          webhookId: w.id,
          event: options.event,
          status: "pending",
        });
        const ok = await enqueueWebhookDelivery({
          deliveryId: delivery.id,
          webhookId: w.id,
          userId: options.userId,
          url: w.url,
          secret: w.secret,
          event: options.event,
          payload: options.payload,
          enqueuedAt,
        });
        if (!ok) {
          // Queue unavailable — flip the row to failed so it shows up in the
          // user's delivery log instead of dangling at "pending" forever.
          await delivery.update({
            status: "failed",
            attempts: 0,
            lastError: "queue unavailable",
            updatedAt: new Date(),
          });
        } else {
          metrics.webhookDeliveriesEnqueued?.inc();
        }
      })
    );
  } catch (err) {
    console.error(
      `[webhook-emitter] failed to emit "${options.event}":`,
      err
    );
  }
}

// Used by the UI's "send test event" button. Sends a fixed payload to a
// single webhook without checking subscription filters.
export async function emitTestEvent(webhookId: string): Promise<string | null> {
  const webhook = await Webhook.findByPk(webhookId, { raw: true });
  if (!webhook) return null;
  const delivery = await WebhookDelivery.create({
    id: randomUUID(),
    webhookId: webhook.id,
    event: "test.ping",
    status: "pending",
  });
  const ok = await enqueueWebhookDelivery({
    deliveryId: delivery.id,
    webhookId: webhook.id,
    userId: webhook.userId,
    url: webhook.url,
    secret: webhook.secret,
    event: "test.ping",
    payload: { message: "Hello from Cortala — this is a test delivery." },
    enqueuedAt: Date.now(),
  });
  if (!ok) {
    await delivery.update({
      status: "failed",
      attempts: 0,
      lastError: "queue unavailable",
      updatedAt: new Date(),
    });
  }
  return delivery.id;
}

// Removed by webhooks API only — kept here so test setup can clear inline.
export async function purgeDeliveriesOlderThan(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return WebhookDelivery.destroy({
    where: { createdAt: { [Op.lt]: cutoff } },
  });
}

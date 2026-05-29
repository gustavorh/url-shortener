import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import { QUEUE_NAMES, type WebhookJobData } from "@/lib/queue";
import { WebhookDelivery } from "@/models";
import { buildSignatureHeader } from "@/lib/webhook-signer";
import { metrics } from "@/lib/metrics";

// BullMQ worker that dispatches outbound webhook POSTs. Lives in its own
// process (scripts/start-webhook-worker.ts) so a Next.js restart doesn't
// interrupt deliveries in flight. Each job carries the secret so the worker
// is stateless beyond the WebhookDelivery row it updates.

export function createWebhookWorkerConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required to run the webhook worker");
  }
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

const DEFAULT_TIMEOUT_MS = 10_000;

async function deliver(job: Job<WebhookJobData>): Promise<void> {
  const data = job.data;
  const attempt = (job.attemptsMade ?? 0) + 1;
  const body = JSON.stringify({
    event: data.event,
    deliveryId: data.deliveryId,
    enqueuedAt: data.enqueuedAt,
    payload: data.payload,
  });
  const signature = buildSignatureHeader(body, data.secret);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.WEBHOOK_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS)
  );

  let responseStatus: number | null = null;
  let lastError: string | null = null;
  try {
    const res = await fetch(data.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Linkly-Webhooks/1.0",
        "X-Linkly-Event": data.event,
        "X-Linkly-Delivery": data.deliveryId,
        "X-Linkly-Signature": signature,
      },
      body,
      signal: controller.signal,
    });
    responseStatus = res.status;
    if (!res.ok) {
      lastError = `HTTP ${res.status}`;
      throw new Error(lastError);
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    await updateDelivery(data.deliveryId, {
      status: "failed",
      attempts: attempt,
      responseStatus,
      lastError,
    });
    metrics.webhookDeliveriesCompleted?.inc({ status: "failed" });
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  await updateDelivery(data.deliveryId, {
    status: "success",
    attempts: attempt,
    responseStatus,
    lastError: null,
  });
  metrics.webhookDeliveriesCompleted?.inc({ status: "success" });
}

async function updateDelivery(
  id: string,
  fields: {
    status: "success" | "failed";
    attempts: number;
    responseStatus: number | null;
    lastError: string | null;
  }
): Promise<void> {
  try {
    await WebhookDelivery.update(
      { ...fields, updatedAt: new Date() },
      { where: { id } }
    );
  } catch (err) {
    console.error(`[webhook-worker] failed to update delivery ${id}:`, err);
  }
}

export function createWebhookWorker(): Worker<WebhookJobData> {
  const concurrency = Number(process.env.WEBHOOK_WORKER_CONCURRENCY ?? 5);
  const worker = new Worker<WebhookJobData>(
    QUEUE_NAMES.WEBHOOKS,
    deliver,
    {
      connection: createWebhookWorkerConnection(),
      concurrency,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[webhook-worker] job ${job?.id ?? "?"} failed (attempt ${
        job?.attemptsMade ?? 0
      }):`,
      err.message
    );
  });

  worker.on("error", (err) => {
    console.error("[webhook-worker] worker error:", err.message);
  });

  return worker;
}

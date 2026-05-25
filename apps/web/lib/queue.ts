import { Queue, type JobsOptions } from "bullmq";
import Redis from "ioredis";

// BullMQ click queue. Producer side: enqueue jobs from the redirect path
// without blocking on MySQL. Worker side lives in lib/workers/click-worker.ts
// and runs in a standalone process started by scripts/start-worker.ts.
//
// The queue is optional — when REDIS_URL is unset or CLICK_QUEUE_DISABLED=1,
// callers fall back to synchronous writes (see lib/analytics.ts → trackClick).

export type ClickJobData = {
  urlId: string;
  targetUrl: string | null;
  userAgent: string | null;
  referrer: string | null;
  rawIp: string;
  country: string | null;
  timestamp: number;
};

// One BullMQ job per webhook subscriber × event. The job carries everything
// the worker needs to dispatch the HTTP POST — payload, target URL, secret
// and the delivery row to update on success/failure. Keeping the secret on
// the job (rather than re-reading from MySQL on each attempt) keeps the
// worker stateless and tolerant of brief MySQL outages.
export type WebhookJobData = {
  deliveryId: string;
  webhookId: string;
  userId: string;
  url: string;
  secret: string;
  event: string;
  payload: unknown;
  enqueuedAt: number;
};

export const QUEUE_NAMES = {
  CLICKS: "cortala-clicks",
  WEBHOOKS: "cortala-webhooks",
} as const;

const globalForQueue = globalThis as unknown as {
  __cortalaQueueRedis?: Redis | null;
  __cortalaClickQueue?: Queue<ClickJobData> | null;
  __cortalaWebhookQueue?: Queue<WebhookJobData> | null;
};

// BullMQ requires `maxRetriesPerRequest: null` because workers issue blocking
// commands that must not time out. We keep this connection separate from
// lib/redis.ts (which uses `maxRetriesPerRequest: 2` for the cache path).
export function getQueueRedis(): Redis | null {
  if (globalForQueue.__cortalaQueueRedis !== undefined) {
    return globalForQueue.__cortalaQueueRedis;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForQueue.__cortalaQueueRedis = null;
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    client.on("error", (err) =>
      console.error("Queue Redis error:", err.message)
    );
    globalForQueue.__cortalaQueueRedis = client;
    return client;
  } catch (err) {
    console.error("Failed to initialize queue Redis:", err);
    globalForQueue.__cortalaQueueRedis = null;
    return null;
  }
}

export function getClickQueue(): Queue<ClickJobData> | null {
  if (process.env.CLICK_QUEUE_DISABLED === "1") return null;

  if (globalForQueue.__cortalaClickQueue !== undefined) {
    return globalForQueue.__cortalaClickQueue;
  }

  const connection = getQueueRedis();
  if (!connection) {
    globalForQueue.__cortalaClickQueue = null;
    return null;
  }

  try {
    const queue = new Queue<ClickJobData>(QUEUE_NAMES.CLICKS, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    globalForQueue.__cortalaClickQueue = queue;
    return queue;
  } catch (err) {
    console.error("Failed to create click queue:", err);
    globalForQueue.__cortalaClickQueue = null;
    return null;
  }
}

export function isClickQueueEnabled(): boolean {
  return getClickQueue() !== null;
}

// Returns true when the job was successfully enqueued. False (with the caller
// falling back to a synchronous write) when Redis/BullMQ is unavailable or
// the enqueue itself fails — clicks must never be lost.
export async function enqueueClick(
  data: ClickJobData,
  options?: JobsOptions
): Promise<boolean> {
  const queue = getClickQueue();
  if (!queue) return false;
  try {
    await queue.add("click", data, options);
    return true;
  } catch (err) {
    console.error("Failed to enqueue click:", err);
    return false;
  }
}

// Webhook queue. Three attempts with exponential backoff (~5s, ~30s, ~2m)
// so transient subscriber outages recover automatically. The worker writes
// final status back into the WebhookDelivery row.
export function getWebhookQueue(): Queue<WebhookJobData> | null {
  if (process.env.WEBHOOKS_QUEUE_DISABLED === "1") return null;

  if (globalForQueue.__cortalaWebhookQueue !== undefined) {
    return globalForQueue.__cortalaWebhookQueue;
  }

  const connection = getQueueRedis();
  if (!connection) {
    globalForQueue.__cortalaWebhookQueue = null;
    return null;
  }

  try {
    const queue = new Queue<WebhookJobData>(QUEUE_NAMES.WEBHOOKS, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 2000 },
      },
    });
    globalForQueue.__cortalaWebhookQueue = queue;
    return queue;
  } catch (err) {
    console.error("Failed to create webhook queue:", err);
    globalForQueue.__cortalaWebhookQueue = null;
    return null;
  }
}

export function isWebhookQueueEnabled(): boolean {
  return getWebhookQueue() !== null;
}

// Returns true on a successful enqueue. False when the queue is unavailable;
// the caller decides whether to record a failed delivery or just drop the
// event (we drop, because webhook subscribers expect at-most-once retries
// from the queue itself, not from the producer).
export async function enqueueWebhookDelivery(
  data: WebhookJobData,
  options?: JobsOptions
): Promise<boolean> {
  const queue = getWebhookQueue();
  if (!queue) return false;
  try {
    await queue.add(data.event, data, options);
    return true;
  } catch (err) {
    console.error("Failed to enqueue webhook delivery:", err);
    return false;
  }
}

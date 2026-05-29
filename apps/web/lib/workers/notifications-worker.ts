import { Queue, Worker, type Job } from "bullmq";
import Redis from "ioredis";
import { Op } from "sequelize";
import { Url } from "@/models";
import { getClickCounts } from "@/lib/stats-queries";
import { createIfMissing } from "@/lib/notifications-service";

// Periodic BullMQ worker that materializes notifications for events that
// can't be detected synchronously: expirations and click-limit milestones.
// Runs as its own process via scripts/start-notifications-worker.ts.

export const NOTIFICATIONS_QUEUE = "linkly-notifications";
const SCAN_JOB = "scan";
const DIGEST_JOB = "weekly-digest";

const SCAN_INTERVAL_MS = Number(
  process.env.NOTIFICATIONS_SCAN_INTERVAL_MS ?? 5 * 60 * 1000
);

export function createNotificationsConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required to run the notifications worker");
  }
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Finds links expiring in the next 24h and ones already expired, and creates
// a notification for any user/link pair that doesn't have one yet. Idempotent
// thanks to createIfMissing — safe to run on a tight schedule.
export async function runExpirationScan(): Promise<{
  expiringSoon: number;
  expired: number;
  limitReached: number;
}> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let expiringSoon = 0;
  let expired = 0;
  let limitReached = 0;

  const soon = await Url.findAll({
    where: {
      userId: { [Op.ne]: null },
      deletedAt: null,
      expirationDate: { [Op.gt]: now, [Op.lte]: in24h },
    },
    attributes: ["id", "userId", "title", "originalUrl", "expirationDate"],
    raw: true,
  });
  for (const link of soon) {
    if (!link.userId) continue;
    const created = await createIfMissing(
      {
        userId: link.userId,
        type: "link.expiring_soon",
        payload: {
          linkId: link.id,
          title: link.title ?? null,
          originalUrl: link.originalUrl,
          expirationDate: link.expirationDate,
        },
      },
      "linkId"
    );
    if (created) expiringSoon++;
  }

  const past = await Url.findAll({
    where: {
      userId: { [Op.ne]: null },
      deletedAt: null,
      expirationDate: { [Op.lte]: now },
    },
    attributes: ["id", "userId", "title", "originalUrl", "expirationDate"],
    raw: true,
  });
  for (const link of past) {
    if (!link.userId) continue;
    const created = await createIfMissing(
      {
        userId: link.userId,
        type: "link.expired",
        payload: {
          linkId: link.id,
          title: link.title ?? null,
          originalUrl: link.originalUrl,
          expirationDate: link.expirationDate,
        },
      },
      "linkId"
    );
    if (created) expired++;
  }

  const capped = await Url.findAll({
    where: {
      userId: { [Op.ne]: null },
      deletedAt: null,
      maxClicks: { [Op.ne]: null },
    },
    attributes: ["id", "userId", "title", "originalUrl", "maxClicks"],
    raw: true,
  });
  if (capped.length > 0) {
    const counts = await getClickCounts(capped.map((l) => l.id));
    for (const link of capped) {
      if (!link.userId || link.maxClicks == null) continue;
      const used = counts.get(link.id) ?? 0;
      if (used < link.maxClicks) continue;
      const created = await createIfMissing(
        {
          userId: link.userId,
          type: "link.limit_reached",
          payload: {
            linkId: link.id,
            title: link.title ?? null,
            originalUrl: link.originalUrl,
            maxClicks: link.maxClicks,
            clicks: used,
          },
        },
        "linkId"
      );
      if (created) limitReached++;
    }
  }

  return { expiringSoon, expired, limitReached };
}

async function processJob(
  job: Job<{ kind?: string }>
): Promise<void> {
  if (job.name === DIGEST_JOB) {
    // Weekly digest is a follow-up — left as a no-op for now so the cron
    // hook can be added without changing the worker shape.
    return;
  }
  const result = await runExpirationScan();
  console.log(
    `[notifications-worker] scan complete: expiringSoon=${result.expiringSoon}, expired=${result.expired}, limitReached=${result.limitReached}`
  );
}

export function createNotificationsWorker(connection: Redis): Worker {
  const worker = new Worker(NOTIFICATIONS_QUEUE, processJob, {
    connection,
    concurrency: 1,
  });
  worker.on("failed", (job, err) => {
    console.error(
      `[notifications-worker] job ${job?.id ?? "?"} failed:`,
      err.message
    );
  });
  worker.on("error", (err) => {
    console.error("[notifications-worker] worker error:", err.message);
  });
  return worker;
}

// Registers the repeatable jobs. Idempotent — BullMQ deduplicates by jobId.
export async function scheduleRepeatableJobs(
  connection: Redis
): Promise<Queue> {
  const queue = new Queue(NOTIFICATIONS_QUEUE, { connection });
  await queue.add(
    SCAN_JOB,
    {},
    {
      repeat: { every: SCAN_INTERVAL_MS },
      jobId: "scan-recurring",
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    }
  );
  // Weekly digest at Mondays 09:00 UTC. The worker handler is a no-op until
  // the digest is implemented; the schedule itself is harmless.
  await queue.add(
    DIGEST_JOB,
    {},
    {
      repeat: { pattern: "0 9 * * 1" },
      jobId: "weekly-digest-recurring",
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 10 },
    }
  );
  return queue;
}

import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import { QUEUE_NAMES, type ClickJobData } from "@/lib/queue";
import { recordClickSync } from "@/lib/analytics";

// BullMQ worker that drains the click queue. Runs in a standalone process
// (scripts/start-worker.ts) so the Next.js app stays free of long-lived
// background work. Each job calls into the same recordClickSync used by the
// synchronous fallback — the persistence path is identical regardless of
// whether the click came through the queue or not.

export function createWorkerConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required to run the click worker");
  }
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

async function processClick(job: Job<ClickJobData>): Promise<void> {
  await recordClickSync(job.data);
}

export function createClickWorker(): Worker<ClickJobData> {
  const concurrency = Number(process.env.CLICK_WORKER_CONCURRENCY ?? 5);
  const worker = new Worker<ClickJobData>(QUEUE_NAMES.CLICKS, processClick, {
    connection: createWorkerConnection(),
    concurrency,
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[click-worker] job ${job?.id ?? "?"} failed (attempt ${
        job?.attemptsMade ?? 0
      }):`,
      err.message
    );
  });

  worker.on("error", (err) => {
    console.error("[click-worker] worker error:", err.message);
  });

  return worker;
}

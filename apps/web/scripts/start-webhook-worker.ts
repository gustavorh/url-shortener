import "dotenv/config";
import { testConnection } from "@/lib/db";
import { createWebhookWorker } from "@/lib/workers/webhook-worker";

// Standalone entry point for the BullMQ webhook delivery worker. Run with:
//   pnpm webhook-worker          (one-off)
//   pnpm webhook-worker:dev      (auto-reload during development)
//
// In production this should run as its own long-lived process alongside
// the click worker (PM2 / systemd / separate container).

async function main(): Promise<void> {
  await testConnection();
  console.log("[webhook-worker] connected to MySQL");

  const worker = createWebhookWorker();
  console.log(
    `[webhook-worker] listening for jobs (concurrency=${
      process.env.WEBHOOK_WORKER_CONCURRENCY ?? 5
    })`
  );

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    console.log(`[webhook-worker] received ${signal}, shutting down…`);
    try {
      await worker.close();
      console.log("[webhook-worker] worker closed cleanly");
      process.exit(0);
    } catch (err) {
      console.error("[webhook-worker] error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[webhook-worker] failed to start:", err);
  process.exit(1);
});

import "dotenv/config";
import { testConnection } from "@/lib/db";
import { createClickWorker } from "@/lib/workers/click-worker";

// Standalone entry point for the BullMQ click worker. Run with:
//   pnpm worker          (one-off)
//   pnpm worker:dev      (auto-reload during development)
//
// In production this should run as its own long-lived process (PM2, a
// systemd unit, a separate Docker container, etc.) so a Next.js restart
// does not interrupt click ingestion.

async function main(): Promise<void> {
  await testConnection();
  console.log("[click-worker] connected to MySQL");

  const worker = createClickWorker();
  console.log(
    `[click-worker] listening for jobs (concurrency=${
      process.env.CLICK_WORKER_CONCURRENCY ?? 5
    })`
  );

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    console.log(`[click-worker] received ${signal}, shutting down…`);
    try {
      await worker.close();
      console.log("[click-worker] worker closed cleanly");
      process.exit(0);
    } catch (err) {
      console.error("[click-worker] error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[click-worker] failed to start:", err);
  process.exit(1);
});

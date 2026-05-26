import "dotenv/config";
import { testConnection } from "@/lib/db";
import {
  createNotificationsConnection,
  createNotificationsWorker,
  scheduleRepeatableJobs,
} from "@/lib/workers/notifications-worker";

// Standalone entry point for the periodic notifications worker. Run with:
//   pnpm notifications:worker
//   pnpm notifications:worker:dev
//
// In production, run as its own long-lived process (PM2, systemd, container).
// Multiple instances are safe — BullMQ deduplicates the repeatable jobs by
// jobId and createIfMissing guards against duplicate notifications.

async function main(): Promise<void> {
  await testConnection();
  console.log("[notifications-worker] connected to MySQL");

  const connection = createNotificationsConnection();
  await scheduleRepeatableJobs(connection);
  console.log("[notifications-worker] repeatable jobs scheduled");

  const worker = createNotificationsWorker(connection);
  console.log("[notifications-worker] listening for jobs");

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    console.log(`[notifications-worker] received ${signal}, shutting down…`);
    try {
      await worker.close();
      await connection.quit();
      console.log("[notifications-worker] closed cleanly");
      process.exit(0);
    } catch (err) {
      console.error("[notifications-worker] error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[notifications-worker] failed to start:", err);
  process.exit(1);
});

import { Registry, Counter, collectDefaultMetrics } from "prom-client";

// Application metrics exposed at /api/metrics in Prometheus format.
// Counters are in-process: fine for a single long-lived Node process, and
// Prometheus handles counter resets across restarts.

interface MetricsBundle {
  registry: Registry;
  linksCreated: Counter;
  redirects: Counter<"result">;
  clicksRecorded: Counter;
  webhookDeliveriesEnqueued: Counter;
  webhookDeliveriesCompleted: Counter<"status">;
  notificationsSent: Counter<"type">;
}

// Stored on globalThis so Next.js dev hot-reload does not re-register
// metrics (prom-client throws on duplicate names).
const globalForMetrics = globalThis as unknown as {
  __linklyMetrics?: MetricsBundle;
};

function createMetrics(): MetricsBundle {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "linkly_" });

  const linksCreated = new Counter({
    name: "linkly_links_created_total",
    help: "Total short links created",
    registers: [registry],
  });
  const redirects = new Counter({
    name: "linkly_redirects_total",
    help: "Total redirect requests, labelled by result",
    labelNames: ["result"] as const,
    registers: [registry],
  });
  const clicksRecorded = new Counter({
    name: "linkly_clicks_recorded_total",
    help: "Total click events persisted",
    registers: [registry],
  });
  const webhookDeliveriesEnqueued = new Counter({
    name: "linkly_webhook_deliveries_enqueued_total",
    help: "Total webhook deliveries enqueued to BullMQ",
    registers: [registry],
  });
  const webhookDeliveriesCompleted = new Counter({
    name: "linkly_webhook_deliveries_completed_total",
    help: "Total webhook deliveries finalized, labelled by status",
    labelNames: ["status"] as const,
    registers: [registry],
  });
  const notificationsSent = new Counter({
    name: "linkly_notifications_sent_total",
    help: "Total in-app notifications created, labelled by type",
    labelNames: ["type"] as const,
    registers: [registry],
  });

  return {
    registry,
    linksCreated,
    redirects,
    clicksRecorded,
    webhookDeliveriesEnqueued,
    webhookDeliveriesCompleted,
    notificationsSent,
  };
}

export const metrics: MetricsBundle =
  globalForMetrics.__linklyMetrics ??
  (globalForMetrics.__linklyMetrics = createMetrics());

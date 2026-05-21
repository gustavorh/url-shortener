import { Registry, Counter, collectDefaultMetrics } from "prom-client";

// Application metrics exposed at /api/metrics in Prometheus format.
// Counters are in-process: fine for a single long-lived Node process, and
// Prometheus handles counter resets across restarts.

interface MetricsBundle {
  registry: Registry;
  linksCreated: Counter;
  redirects: Counter<"result">;
  clicksRecorded: Counter;
}

// Stored on globalThis so Next.js dev hot-reload does not re-register
// metrics (prom-client throws on duplicate names).
const globalForMetrics = globalThis as unknown as {
  __cortalaMetrics?: MetricsBundle;
};

function createMetrics(): MetricsBundle {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "cortala_" });

  const linksCreated = new Counter({
    name: "cortala_links_created_total",
    help: "Total short links created",
    registers: [registry],
  });
  const redirects = new Counter({
    name: "cortala_redirects_total",
    help: "Total redirect requests, labelled by result",
    labelNames: ["result"] as const,
    registers: [registry],
  });
  const clicksRecorded = new Counter({
    name: "cortala_clicks_recorded_total",
    help: "Total click events persisted",
    registers: [registry],
  });

  return { registry, linksCreated, redirects, clicksRecorded };
}

export const metrics: MetricsBundle =
  globalForMetrics.__cortalaMetrics ??
  (globalForMetrics.__cortalaMetrics = createMetrics());

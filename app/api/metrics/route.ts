import { metrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/metrics — Prometheus exposition endpoint.
export async function GET() {
  const body = await metrics.registry.metrics();
  return new Response(body, {
    headers: { "Content-Type": metrics.registry.contentType },
  });
}

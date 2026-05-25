import pc from "picocolors";
import { requireConfig } from "../config.js";
import { api } from "../client.js";

export interface StatsOptions {
  json?: boolean;
}

// `cortala stats <id> [--json]` — prints the analytics summary for a
// single link. The default output is human-readable; --json dumps the raw
// payload for scripting.
export async function runStats(id: string, opts: StatsOptions): Promise<void> {
  const cfg = await requireConfig();
  const stats = await api.getStats(cfg, id);

  if (opts.json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(pc.bold(`Estadísticas de ${id}`));
  console.log(`  ${pc.dim("clics totales:")}  ${pc.cyan(String(stats.total))}`);
  printGroup("países", stats.byCountry);
  printGroup("dispositivos", stats.byDevice);
  printGroup("navegadores", stats.byBrowser);
  printGroup("sistemas", stats.byOs);
  printGroup("orígenes", stats.topReferrers);
  printGroup("destinos", stats.byTarget);
}

function printGroup(title: string, rows: Array<{ label: string; count: number }>): void {
  if (rows.length === 0) return;
  console.log(`\n  ${pc.bold(title)}`);
  const total = rows.reduce((acc, r) => acc + r.count, 0);
  for (const row of rows) {
    const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
    console.log(
      `    ${row.label.padEnd(20)} ${pc.cyan(String(row.count).padStart(6))} ${pc.dim(`${pct}%`)}`
    );
  }
}

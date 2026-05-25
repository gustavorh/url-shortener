import pc from "picocolors";
import { requireConfig } from "../config.js";
import { api } from "../client.js";

export interface ShortenOptions {
  alias?: string;
  expires?: string;
  password?: string;
  maxClicks?: string;
  activeFrom?: string;
  quiet?: boolean;
}

// `cortala shorten <url> [options]` — creates a short link and prints the
// resulting URL. With --quiet the output is just the bare short URL, which
// makes the command pipeable (`cortala shorten ... | pbcopy`).
export async function runShorten(url: string, opts: ShortenOptions): Promise<void> {
  const cfg = await requireConfig();
  const maxClicks = opts.maxClicks ? Number(opts.maxClicks) : undefined;
  if (opts.maxClicks && Number.isNaN(maxClicks)) {
    throw new Error("--max-clicks debe ser un número entero.");
  }

  const created = await api.createLink(cfg, {
    url,
    customAlias: opts.alias ?? null,
    expirationDate: opts.expires ?? null,
    password: opts.password ?? null,
    maxClicks: maxClicks ?? null,
    activeFrom: opts.activeFrom ?? null,
  });

  if (opts.quiet) {
    process.stdout.write(created.shortUrl + "\n");
    return;
  }

  console.log(`${pc.green("✓")} ${pc.bold(created.shortUrl)}`);
  console.log(`  ${pc.dim("destino:")}  ${created.originalUrl}`);
  console.log(`  ${pc.dim("id:")}        ${created.id}`);
  if (created.expirationDate) {
    console.log(`  ${pc.dim("expira:")}   ${formatDate(created.expirationDate)}`);
  }
}

function formatDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

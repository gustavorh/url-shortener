import pc from "picocolors";
import { requireConfig } from "../config.js";
import { api } from "../client.js";

export interface ListOptions {
  limit?: string;
  offset?: string;
  search?: string;
  tag?: string;
  json?: boolean;
}

// `linkly list [options]` — fetches and prints the caller's links. With
// --json, dumps the raw API response unchanged for piping into jq.
export async function runList(opts: ListOptions): Promise<void> {
  const cfg = await requireConfig();
  const limit = opts.limit ? clampInt(opts.limit, 1, 100) : undefined;
  const offset = opts.offset ? clampInt(opts.offset, 0, Number.MAX_SAFE_INTEGER) : undefined;

  const data = await api.listLinks(cfg, {
    limit,
    offset,
    search: opts.search,
    tag: opts.tag,
  });

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (data.links.length === 0) {
    console.log(pc.dim("(sin enlaces que mostrar)"));
    return;
  }

  for (const link of data.links) {
    const disabled = link.disabled ? pc.red("(pausado) ") : "";
    console.log(`${disabled}${pc.bold(link.shortUrl)}  ${pc.dim("→")}  ${link.originalUrl}`);
    const meta = [
      link.title ? pc.dim(link.title) : null,
      `${pc.cyan(String(link.clicks))} clics`,
      link.tags.length > 0 ? link.tags.map((t) => `#${t}`).join(" ") : null,
    ].filter(Boolean);
    console.log("  " + meta.join("  ·  "));
  }
  console.log(
    pc.dim(
      `\nmostrando ${data.links.length} de ${data.total}` +
        (data.offset > 0 ? ` (offset ${data.offset})` : "")
    )
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`valor numérico inválido: ${raw}`);
  }
  if (n < min || n > max) {
    throw new Error(`valor fuera de rango [${min}, ${max}]: ${n}`);
  }
  return n;
}

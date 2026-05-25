import pc from "picocolors";
import { requireConfig } from "../config.js";
import { api } from "../client.js";

// `cortala whoami` — shows the account behind the saved API key, plus
// totals (link count, click count). Handy as a quick "am I logged in?".
export async function runWhoami(): Promise<void> {
  const cfg = await requireConfig();
  const me = await api.me(cfg);
  console.log(pc.bold(me.email) + (me.username ? `  ${pc.dim("@" + me.username)}` : ""));
  if (me.name) console.log(`  ${me.name}`);
  console.log(
    `  ${pc.dim("enlaces:")} ${pc.cyan(String(me.links))}  ${pc.dim("clics:")} ${pc.cyan(String(me.clicks))}`
  );
  console.log(`  ${pc.dim("servidor:")} ${cfg.baseUrl}`);
}

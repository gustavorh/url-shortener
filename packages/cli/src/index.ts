#!/usr/bin/env node
// Linkly CLI entrypoint. Each command lives in its own file under
// ./commands; this module just wires them up with `commander` and applies
// a single uniform error handler.

import { Command } from "commander";
import pc from "picocolors";
import { ApiError } from "./client.js";
import { runLogin } from "./commands/login.js";
import { runLogout } from "./commands/logout.js";
import { runWhoami } from "./commands/whoami.js";
import { runShorten } from "./commands/shorten.js";
import { runList } from "./commands/list.js";
import { runStats } from "./commands/stats.js";

const program = new Command();

program
  .name("linkly")
  .description("Acorta y administra enlaces de Linkly desde la terminal.")
  .version("0.1.0")
  .showHelpAfterError();

program
  .command("login")
  .description("Guarda una API key y verifica el acceso.")
  .option("--api-key <key>", "API key (también se acepta vía $LINKLY_API_KEY)")
  .option("--base-url <url>", "URL del servidor de Linkly")
  .action((opts) => runWithErrors(() => runLogin(opts)));

program
  .command("logout")
  .description("Olvida la API key guardada.")
  .action(() => runWithErrors(runLogout));

program
  .command("whoami")
  .description("Muestra la cuenta autenticada y totales.")
  .action(() => runWithErrors(runWhoami));

program
  .command("shorten <url>")
  .description("Acorta una URL.")
  .option("-a, --alias <alias>", "alias personalizado (slug)")
  .option("-e, --expires <iso>", "fecha de expiración (ISO 8601)")
  .option("-p, --password <password>", "contraseña para desbloquear el enlace")
  .option("-m, --max-clicks <n>", "número máximo de clics permitidos")
  .option("--active-from <iso>", "activar a partir de esta fecha (ISO 8601)")
  .option("-q, --quiet", "imprime solo la URL corta (útil para pipes)")
  .action((url: string, opts) => runWithErrors(() => runShorten(url, opts)));

program
  .command("list")
  .description("Lista tus enlaces (paginado).")
  .option("--limit <n>", "tamaño de página [1-100]", "50")
  .option("--offset <n>", "desplazamiento", "0")
  .option("-s, --search <term>", "búsqueda libre en id/URL/título")
  .option("-t, --tag <tag>", "filtra por etiqueta")
  .option("--json", "imprime la respuesta cruda en JSON")
  .action((opts) => runWithErrors(() => runList(opts)));

program
  .command("stats <id>")
  .description("Muestra la analítica de un enlace.")
  .option("--json", "imprime la respuesta cruda en JSON")
  .action((id: string, opts) => runWithErrors(() => runStats(id, opts)));

async function runWithErrors(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const message =
      err instanceof ApiError
        ? `${err.message} ${pc.dim(`(HTTP ${err.status})`)}`
        : err instanceof Error
          ? err.message
          : String(err);
    process.stderr.write(`${pc.red("✗")} ${message}\n`);
    process.exit(1);
  }
}

// Promise rejection guard for any await that escaped our wrappers — keeps
// the exit code meaningful for CI integrations.
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`${pc.red("unhandled rejection:")} ${String(reason)}\n`);
  process.exit(1);
});

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`${pc.red("✗")} ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});

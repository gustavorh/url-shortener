import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import pc from "picocolors";
import {
  DEFAULT_BASE_URL,
  configPath,
  loadConfig,
  saveConfig,
} from "../config.js";
import { api, ApiError } from "../client.js";

interface LoginOptions {
  baseUrl?: string;
  apiKey?: string;
}

// `cortala login` — prompts for the API key (or accepts it via --api-key),
// validates it against /api/v1/me, and writes the config to disk with
// mode 0600.
export async function runLogin(opts: LoginOptions): Promise<void> {
  const existing = await loadConfig();
  const baseUrl =
    opts.baseUrl ?? existing?.baseUrl ?? process.env.CORTALA_URL ?? DEFAULT_BASE_URL;

  let apiKey = opts.apiKey ?? process.env.CORTALA_API_KEY ?? "";
  if (!apiKey) {
    // Interactive prompt. We don't mask the input because readline doesn't
    // ship a portable mask helper and the user is in their own terminal —
    // good enough for now, we can add one later if it matters.
    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
      stdout.write(`URL base ${pc.dim(`[${baseUrl}]`)}: `);
      const inputUrl = (await rl.question("")).trim();
      const finalUrl = inputUrl || baseUrl;
      apiKey = (await rl.question("API key (crtl_…): ")).trim();
      if (!apiKey) {
        throw new Error("Operación cancelada — no se introdujo ninguna API key.");
      }
      await persistAndVerify({ baseUrl: finalUrl, apiKey });
      return;
    } finally {
      rl.close();
    }
  }

  await persistAndVerify({ baseUrl, apiKey });
}

async function persistAndVerify(cfg: { baseUrl: string; apiKey: string }): Promise<void> {
  process.stdout.write(`Verificando con ${pc.cyan(cfg.baseUrl)}… `);
  try {
    const me = await api.me(cfg);
    process.stdout.write(pc.green("OK\n"));
    await saveConfig(cfg);
    console.log(
      `${pc.green("✓")} Sesión iniciada como ${pc.bold(me.email)}` +
        (me.username ? ` (${me.username})` : "")
    );
    console.log(pc.dim(`  Config guardada en ${configPath()} (modo 0600)`));
  } catch (err) {
    process.stdout.write(pc.red("falló\n"));
    if (err instanceof ApiError && err.status === 401) {
      throw new Error("API key inválida. Genera una nueva en el panel y vuelve a intentar.");
    }
    throw err;
  }
}

// Manages the on-disk CLI config — `~/.config/cortala/config.json` by
// default, overridable via $XDG_CONFIG_HOME. Stored with mode 0600 because
// it contains the user's API key.

import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface CortalaConfig {
  baseUrl: string;
  apiKey: string;
}

export const DEFAULT_BASE_URL = "http://localhost:3000";

function configHome(): string {
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
}

export function configPath(): string {
  return process.env.CORTALA_CONFIG_PATH || join(configHome(), "cortala", "config.json");
}

export async function loadConfig(): Promise<CortalaConfig | null> {
  try {
    const raw = await fs.readFile(configPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<CortalaConfig>;
    if (!parsed.apiKey || !parsed.baseUrl) return null;
    return { baseUrl: parsed.baseUrl, apiKey: parsed.apiKey };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function saveConfig(cfg: CortalaConfig): Promise<void> {
  const path = configPath();
  await fs.mkdir(dirname(path), { recursive: true });
  // Write then chmod — on POSIX the chmod must follow the write because
  // the umask can widen the initial mode. We deliberately pick 0600 (rw-
  // for the owner only) so other local users can't peek at the API key.
  await fs.writeFile(path, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  try {
    await fs.chmod(path, 0o600);
  } catch {
    // Windows or some filesystems ignore chmod — we still attempted it.
  }
}

export async function clearConfig(): Promise<boolean> {
  try {
    await fs.unlink(configPath());
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

// Read the config and throw a helpful error if the user hasn't logged in.
// Used by every authenticated command so the message stays uniform.
export async function requireConfig(): Promise<CortalaConfig> {
  const cfg = await loadConfig();
  if (!cfg) {
    throw new Error(
      "No has iniciado sesión. Ejecuta `cortala login` para guardar tu API key."
    );
  }
  return cfg;
}

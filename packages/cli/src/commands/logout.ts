import pc from "picocolors";
import { clearConfig, configPath } from "../config.js";

// `linkly logout` — removes the on-disk config. Idempotent: silently
// succeeds even when nothing was saved.
export async function runLogout(): Promise<void> {
  const removed = await clearConfig();
  if (removed) {
    console.log(`${pc.green("✓")} Sesión cerrada. ${pc.dim(`Borré ${configPath()}.`)}`);
  } else {
    console.log(pc.dim("No había ninguna sesión guardada."));
  }
}

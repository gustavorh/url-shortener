import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  clearConfig,
  configPath,
  loadConfig,
  saveConfig,
} from "../src/config";

const dirs: string[] = [];

beforeEach(async () => {
  const dir = await fs.mkdtemp(join(tmpdir(), "linkly-cli-test-"));
  process.env.LINKLY_CONFIG_PATH = join(dir, "config.json");
  dirs.push(dir);
});

afterEach(async () => {
  delete process.env.LINKLY_CONFIG_PATH;
  for (const dir of dirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe("loadConfig", () => {
  it("devuelve null cuando el archivo no existe", async () => {
    expect(await loadConfig()).toBeNull();
  });

  it("devuelve null cuando faltan campos requeridos", async () => {
    await fs.writeFile(configPath(), JSON.stringify({ baseUrl: "x" }), "utf8");
    expect(await loadConfig()).toBeNull();
  });

  it("devuelve el config cuando está completo", async () => {
    await fs.writeFile(
      configPath(),
      JSON.stringify({ baseUrl: "http://localhost:3000", apiKey: "crtl_xxx" }),
      "utf8"
    );
    const cfg = await loadConfig();
    expect(cfg).toEqual({
      baseUrl: "http://localhost:3000",
      apiKey: "crtl_xxx",
    });
  });
});

describe("saveConfig", () => {
  it("crea el directorio padre y escribe el JSON", async () => {
    await saveConfig({ baseUrl: "http://localhost:3000", apiKey: "crtl_xxx" });
    const raw = await fs.readFile(configPath(), "utf8");
    expect(JSON.parse(raw)).toEqual({
      baseUrl: "http://localhost:3000",
      apiKey: "crtl_xxx",
    });
  });

  it("aplica modo 0600 al archivo", async () => {
    await saveConfig({ baseUrl: "http://localhost:3000", apiKey: "crtl_xxx" });
    const stat = await fs.stat(configPath());
    // Solo verificamos los 9 bits de permisos (otros bits son tipo de archivo).
    const mode = stat.mode & 0o777;
    if (process.platform !== "win32") {
      expect(mode).toBe(0o600);
    }
  });
});

describe("clearConfig", () => {
  it("devuelve false cuando no había nada que borrar", async () => {
    expect(await clearConfig()).toBe(false);
  });

  it("borra el archivo si existe", async () => {
    await saveConfig({ baseUrl: "http://localhost:3000", apiKey: "crtl_xxx" });
    expect(await clearConfig()).toBe(true);
    expect(await loadConfig()).toBeNull();
  });
});

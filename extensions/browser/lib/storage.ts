// Thin wrapper around browser.storage.local (WXT's polyfill works on both
// Chrome and Firefox). All extension surfaces — popup, options, background
// — read/write the API key + base URL through this module so the on-disk
// shape stays in one place.

import { storage } from "wxt/utils/storage";

export interface ExtensionConfig {
  baseUrl: string;
  apiKey: string;
}

export const DEFAULT_BASE_URL = "http://localhost:3000";

const baseUrlItem = storage.defineItem<string>("local:baseUrl", {
  fallback: DEFAULT_BASE_URL,
});
const apiKeyItem = storage.defineItem<string>("local:apiKey", {
  fallback: "",
});

export async function getConfig(): Promise<ExtensionConfig> {
  const [baseUrl, apiKey] = await Promise.all([
    baseUrlItem.getValue(),
    apiKeyItem.getValue(),
  ]);
  return { baseUrl, apiKey };
}

export async function setConfig(cfg: ExtensionConfig): Promise<void> {
  await Promise.all([
    baseUrlItem.setValue(cfg.baseUrl),
    apiKeyItem.setValue(cfg.apiKey),
  ]);
}

export async function isConfigured(): Promise<boolean> {
  const cfg = await getConfig();
  return Boolean(cfg.apiKey && cfg.baseUrl);
}

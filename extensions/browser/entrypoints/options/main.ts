// Options page. Loads the saved baseUrl/apiKey, lets the user edit them,
// and on save calls the same verify path the popup would (round-trips
// through the background SW so a single code path validates credentials).

import { getConfig, setConfig } from "../../lib/storage";
import type { VerifyResponse, ExtensionMessage } from "../../lib/messages";

async function init(): Promise<void> {
  const form = document.getElementById("form") as HTMLFormElement;
  const baseUrl = document.getElementById("base-url") as HTMLInputElement;
  const apiKey = document.getElementById("api-key") as HTMLInputElement;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const status = document.getElementById("status") as HTMLParagraphElement;

  const existing = await getConfig();
  baseUrl.value = existing.baseUrl;
  apiKey.value = existing.apiKey;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void handleSave({ baseUrl, apiKey, saveBtn, status });
  });
}

async function handleSave(els: {
  baseUrl: HTMLInputElement;
  apiKey: HTMLInputElement;
  saveBtn: HTMLButtonElement;
  status: HTMLParagraphElement;
}): Promise<void> {
  const baseUrl = els.baseUrl.value.trim().replace(/\/+$/, "");
  const apiKey = els.apiKey.value.trim();
  if (!baseUrl || !apiKey) {
    setStatus(els.status, "error", "Completa ambos campos.");
    return;
  }

  els.saveBtn.disabled = true;
  setStatus(els.status, "", "Guardando…");

  // Save first so the background worker's getConfig() returns the new
  // values when it processes the verify message.
  await setConfig({ baseUrl, apiKey });

  const message: ExtensionMessage = { type: "verify" };
  const response = (await browser.runtime.sendMessage(message)) as VerifyResponse;
  if (response.ok) {
    setStatus(
      els.status,
      "ok",
      `Conectado como ${response.data.email}${
        response.data.username ? ` (@${response.data.username})` : ""
      }.`
    );
  } else {
    setStatus(
      els.status,
      "error",
      `Falló la verificación: ${response.error}${
        response.status ? ` (HTTP ${response.status})` : ""
      }`
    );
  }
  els.saveBtn.disabled = false;
}

function setStatus(el: HTMLParagraphElement, cls: "" | "ok" | "error", msg: string): void {
  el.className = cls;
  el.textContent = msg;
}

void init();

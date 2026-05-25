// Popup entrypoint. Pre-fills the active tab URL, sends a `shorten`
// message to the background service worker, copies the result to the
// clipboard automatically, and exposes "Open" + "Shorten another".

import { isConfigured } from "../../lib/storage";
import type { ExtensionMessage, ShortenResponse } from "../../lib/messages";

interface Elements {
  form: HTMLFormElement;
  url: HTMLInputElement;
  alias: HTMLInputElement;
  submit: HTMLButtonElement;
  result: HTMLElement;
  shortUrl: HTMLParagraphElement;
  copy: HTMLButtonElement;
  open: HTMLButtonElement;
  reset: HTMLButtonElement;
  error: HTMLElement;
  empty: HTMLElement;
  emptyLink: HTMLAnchorElement;
  optionsBtn: HTMLButtonElement;
}

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

async function init(): Promise<void> {
  const els: Elements = {
    form: $("form"),
    url: $("url"),
    alias: $("alias"),
    submit: $("submit-btn"),
    result: $("result"),
    shortUrl: $("short-url"),
    copy: $("copy-btn"),
    open: $("open-btn"),
    reset: $("reset-btn"),
    error: $("error"),
    empty: $("empty"),
    emptyLink: $("empty-link"),
    optionsBtn: $("options-btn"),
  };

  els.optionsBtn.addEventListener("click", () => browser.runtime.openOptionsPage());
  els.emptyLink.addEventListener("click", (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });

  if (!(await isConfigured())) {
    els.empty.hidden = false;
    return;
  }

  // Pre-fill with the active tab URL so the most common path is a single
  // click on "Shorten".
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && /^https?:/.test(tab.url)) {
    els.url.value = tab.url;
  }

  els.form.hidden = false;
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    void handleSubmit(els);
  });

  els.copy.addEventListener("click", () => {
    void navigator.clipboard.writeText(els.shortUrl.textContent ?? "");
    flashCopied(els.copy);
  });
  els.open.addEventListener("click", () => {
    const url = els.shortUrl.textContent;
    if (url) void browser.tabs.create({ url });
  });
  els.reset.addEventListener("click", () => {
    els.result.hidden = true;
    els.error.hidden = true;
    els.form.hidden = false;
    els.url.focus();
    els.url.select();
  });
}

async function handleSubmit(els: Elements): Promise<void> {
  els.error.hidden = true;
  els.submit.disabled = true;
  els.submit.textContent = "Acortando…";

  try {
    const url = els.url.value.trim();
    if (!url) throw new Error("Introduce una URL.");

    const message: ExtensionMessage = {
      type: "shorten",
      body: {
        url,
        customAlias: els.alias.value.trim() || null,
        expirationDate: null,
        password: null,
        maxClicks: null,
        activeFrom: null,
      },
    };
    const response = (await browser.runtime.sendMessage(message)) as ShortenResponse;
    if (!response.ok) {
      showError(els, response.error);
      return;
    }

    els.shortUrl.textContent = response.data.shortUrl;
    els.form.hidden = true;
    els.result.hidden = false;

    // Auto-copy is the most common follow-up action; no reason to make
    // the user click again.
    try {
      await navigator.clipboard.writeText(response.data.shortUrl);
      flashCopied(els.copy);
    } catch {
      /* clipboard denied — the user can still hit the button */
    }
  } catch (err) {
    showError(els, err instanceof Error ? err.message : String(err));
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = "Acortar";
  }
}

function showError(els: Elements, message: string): void {
  els.error.textContent = message;
  els.error.hidden = false;
}

function flashCopied(btn: HTMLButtonElement): void {
  const previous = btn.textContent ?? "Copiar";
  btn.textContent = "Copiado ✓";
  setTimeout(() => {
    btn.textContent = previous;
  }, 1500);
}

void init();

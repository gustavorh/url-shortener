// Background service worker. Centralises the API calls so the popup
// doesn't touch the network directly — keeps host_permissions usage and
// CORS quirks in one place. WXT's defineBackground() wires the right
// per-browser entry shape (Chrome MV3 vs Firefox MV3 backgroun script).

import { api, ApiError } from "../lib/client";
import { getConfig } from "../lib/storage";
import type {
  ExtensionMessage,
  ShortenResponse,
  VerifyResponse,
} from "../lib/messages";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      void (async () => {
        try {
          const cfg = await getConfig();
          if (!cfg.apiKey) {
            sendResponse({
              ok: false,
              error: "Falta configurar la API key. Abre las opciones para hacerlo.",
            } satisfies ShortenResponse);
            return;
          }

          if (message.type === "shorten") {
            const created = await api.shorten(cfg, message.body);
            sendResponse({
              ok: true,
              data: {
                id: created.id,
                shortUrl: created.shortUrl,
                originalUrl: created.originalUrl,
              },
            } satisfies ShortenResponse);
            return;
          }

          if (message.type === "verify") {
            const me = await api.verify(cfg);
            sendResponse({
              ok: true,
              data: { email: me.email, username: me.username },
            } satisfies VerifyResponse);
            return;
          }
        } catch (err) {
          const status = err instanceof ApiError ? err.status : undefined;
          const errorMsg =
            err instanceof Error ? err.message : "Error desconocido";
          sendResponse({ ok: false, error: errorMsg, status });
        }
      })();
      // Tell the browser we will respond asynchronously.
      return true;
    }
  );
});

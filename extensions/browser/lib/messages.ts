// Shape of the messages the popup sends to the background service worker.
// Keeping them as discriminated unions plays nicely with TypeScript and
// avoids stringly-typed handler dispatch.

import type { CreateLinkBody } from "@cortala/schemas/v1";

export type ExtensionMessage =
  | { type: "shorten"; body: CreateLinkBody }
  | { type: "verify" };

export type ShortenResponse =
  | {
      ok: true;
      data: {
        id: string;
        shortUrl: string;
        originalUrl: string;
      };
    }
  | { ok: false; error: string; status?: number };

export type VerifyResponse =
  | { ok: true; data: { email: string; username: string | null } }
  | { ok: false; error: string; status?: number };

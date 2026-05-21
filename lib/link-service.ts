import bcrypt from "bcryptjs";
import { Url } from "@/models";
import {
  validateAndNormalizeUrl,
  assertNotSSRF,
  UrlValidationError,
} from "./url-validation";
import { generateUniqueSlug, validateCustomAlias } from "./slug";
import { isUrlUnsafe } from "./safe-browsing";
import { metrics } from "./metrics";

/** Error carrying the HTTP status a route handler should return. */
export class LinkCreationError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "LinkCreationError";
    this.status = status;
  }
}

export interface CreateLinkInput {
  originalUrl: string;
  customAlias?: string | null;
  expirationDate?: Date | null;
  userId?: string | null;
  /** Optional plaintext password — hashed before storage. */
  password?: string | null;
  /** Optional click limit; the link stops resolving once reached. */
  maxClicks?: number | null;
}

export interface CreatedLink {
  id: string;
  originalUrl: string;
  expirationDate: Date | null;
  creationDate: Date;
  /** True when an existing identical link was returned instead of a new one. */
  reused: boolean;
}

/**
 * Core link-creation logic shared by the single and bulk shorten endpoints:
 * validates and SSRF-checks the URL, resolves a short code (custom alias or
 * generated slug) and persists the row. Throws LinkCreationError on any
 * user-facing failure.
 */
export async function createShortLink(
  input: CreateLinkInput
): Promise<CreatedLink> {
  let originalUrl: string;
  try {
    originalUrl = validateAndNormalizeUrl(input.originalUrl);
    await assertNotSSRF(originalUrl);
  } catch (error) {
    if (error instanceof UrlValidationError) {
      throw new LinkCreationError(error.message, 400);
    }
    throw error;
  }

  // Reject URLs flagged as malicious (no-op unless Safe Browsing is enabled).
  if (await isUrlUnsafe(originalUrl)) {
    throw new LinkCreationError(
      "La URL fue marcada como insegura y no puede acortarse",
      400
    );
  }

  // Reuse an existing identical link for the same user instead of creating a
  // duplicate — unless they explicitly asked for a custom alias.
  const customAlias = input.customAlias?.trim();
  if (input.userId && !customAlias) {
    const existing = await Url.findOne({
      where: { userId: input.userId, originalUrl, deletedAt: null },
      order: [["creationDate", "DESC"]],
    });
    if (existing) {
      return {
        id: existing.id,
        originalUrl: existing.originalUrl,
        expirationDate: existing.expirationDate ?? null,
        creationDate: existing.creationDate,
        reused: true,
      };
    }
  }

  let id: string;
  if (customAlias) {
    const aliasCheck = validateCustomAlias(customAlias);
    if (!aliasCheck.valid) {
      throw new LinkCreationError(aliasCheck.reason, 400);
    }
    if (await Url.findByPk(customAlias)) {
      throw new LinkCreationError(
        "Ese alias ya está en uso, elige otro",
        409
      );
    }
    id = customAlias;
  } else {
    id = await generateUniqueSlug(
      originalUrl,
      async (slug) => (await Url.findByPk(slug)) !== null
    );
  }

  const password = input.password?.trim();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const created = await Url.create({
    id,
    originalUrl,
    expirationDate: input.expirationDate ?? null,
    userId: input.userId ?? null,
    passwordHash,
    maxClicks: input.maxClicks ?? null,
  });
  metrics.linksCreated.inc();

  return {
    id,
    originalUrl,
    expirationDate: created.expirationDate ?? null,
    creationDate: created.creationDate,
    reused: false,
  };
}

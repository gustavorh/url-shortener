import crypto from "node:crypto";
import { isReservedSlug } from "./reserved-slugs";

// Base62 character set for encoding (0-9, a-z, A-Z).
export const BASE62_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Encodes a hash buffer as a 5-character base62 string. */
export function toBase62(hash: Buffer): string {
  let result = "";
  let num = BigInt("0x" + hash.toString("hex"));
  const base = BigInt(62);
  const zero = BigInt(0);

  while (num > zero) {
    const remainder = Number(num % base);
    result = BASE62_CHARS[remainder] + result;
    num = num / base;
  }

  return result.padStart(5, "0").substring(0, 5);
}

/** Deterministically derives a 5-char base62 slug from arbitrary input. */
export function hashToSlug(input: string): string {
  return toBase62(crypto.createHash("md5").update(input).digest());
}

/**
 * Generates a slug that is unique according to the provided `exists` check,
 * salting the hash input on each collision. Throws after 100 attempts.
 */
export async function generateUniqueSlug(
  originalUrl: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const input = originalUrl + (attempt > 0 ? `-${attempt}` : "");
    const slug = hashToSlug(input);
    if (!(await exists(slug))) {
      return slug;
    }
  }
  throw new Error("Failed to generate a unique short URL after 100 attempts");
}

const CUSTOM_ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

export type AliasValidation =
  | { valid: true }
  | { valid: false; reason: string };

/** Validates a user-chosen custom alias for format and reserved collisions. */
export function validateCustomAlias(alias: string): AliasValidation {
  if (!CUSTOM_ALIAS_PATTERN.test(alias)) {
    return {
      valid: false,
      reason:
        "El alias debe tener entre 3 y 32 caracteres: solo letras, números, guion o guion bajo",
    };
  }
  if (isReservedSlug(alias)) {
    return { valid: false, reason: "Ese alias está reservado, elige otro" };
  }
  return { valid: true };
}

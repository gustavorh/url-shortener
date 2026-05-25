import crypto from "node:crypto";

// All API keys start with this identifiable prefix.
const KEY_PREFIX = "crtl_";

export interface GeneratedApiKey {
  /** The full secret key — shown to the user exactly once. */
  key: string;
  /** SHA-256 hash stored in the database. */
  hash: string;
  /** Non-secret leading fragment used to identify the key in the UI. */
  prefix: string;
}

/** SHA-256 hash of an API key, used for storage and lookup. */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/** Creates a new random API key together with its hash and display prefix. */
export function generateApiKey(): GeneratedApiKey {
  const random = crypto.randomBytes(24).toString("base64url");
  const key = KEY_PREFIX + random;
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.slice(0, 12),
  };
}

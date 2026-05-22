// Regional-indicator base codepoint for 'A'.
const FLAG_BASE = 0x1f1e6;
const LETTER_A = 65;

/**
 * Returns the flag emoji for a 2-letter ISO country code (e.g. "US" → 🇺🇸),
 * or an empty string when the code is missing or malformed.
 */
export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[a-zA-Z]{2}$/.test(code)) return "";
  const cc = code.toUpperCase();
  return String.fromCodePoint(
    FLAG_BASE + cc.charCodeAt(0) - LETTER_A,
    FLAG_BASE + cc.charCodeAt(1) - LETTER_A
  );
}

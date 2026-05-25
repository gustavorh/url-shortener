export interface PasswordStrength {
  /** 0 (weakest) to 4 (strongest). */
  score: number;
  label: string;
}

const LABELS = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];

/**
 * Scores a password 0-4 from length and character variety. A lightweight
 * heuristic for UI feedback — not a substitute for a server-side policy.
 */
export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: LABELS[0] };

  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^a-zA-Z0-9]/.test(password)) points++;

  const score = Math.min(points, 4);
  return { score, label: LABELS[score] };
}

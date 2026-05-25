"use client";

import { signIn } from "next-auth/react";
import type { EnabledOAuthProviders } from "@/lib/oauth-config";

// Renders a "Continuar con …" button for every configured OAuth
// provider. Used by /login and /register; gates which buttons to show on
// the server-passed `enabled` prop so we never expose a button that
// would 500 the user.

interface Props {
  enabled: EnabledOAuthProviders;
  callbackUrl?: string;
  label?: "login" | "register";
}

function GithubIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.78-3.78C18.45 1.18 15.45 0 12 0 7.32 0 3.28 2.69 1.32 6.6l4.4 3.42C6.7 7.1 9.13 5.04 12 5.04Z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.8-.07-1.57-.2-2.32H12v4.4h6.45c-.28 1.5-1.12 2.78-2.4 3.64l3.7 2.87c2.16-2 3.42-4.95 3.42-8.59Z"
      />
      <path
        fill="#FBBC05"
        d="M5.72 14.02a7.16 7.16 0 0 1 0-4.6L1.32 6c-1.04 2.06-1.32 4.3-1.32 6 0 1.7.28 3.94 1.32 6l4.4-3.98Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.7-2.87c-1.03.7-2.36 1.11-4.25 1.11-2.87 0-5.3-2.06-6.28-4.99l-4.4 3.42C3.28 21.31 7.32 24 12 24Z"
      />
    </svg>
  );
}

export function OAuthButtons({ enabled, callbackUrl, label = "login" }: Props) {
  if (!enabled.github && !enabled.google) return null;

  const verb = label === "register" ? "Regístrate" : "Continúa";

  return (
    <div className="flex flex-col gap-2">
      {enabled.github && (
        <button
          type="button"
          onClick={() =>
            signIn("github", { callbackUrl: callbackUrl ?? "/dashboard" })
          }
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <GithubIcon />
          {verb} con GitHub
        </button>
      )}
      {enabled.google && (
        <button
          type="button"
          onClick={() =>
            signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" })
          }
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <GoogleIcon />
          {verb} con Google
        </button>
      )}

      <div className="flex items-center gap-3 my-2 text-xs text-gray-400">
        <hr className="flex-1 border-gray-200 dark:border-gray-700" />
        <span>o</span>
        <hr className="flex-1 border-gray-200 dark:border-gray-700" />
      </div>
    </div>
  );
}

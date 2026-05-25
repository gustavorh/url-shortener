"use client";

import { Suspense, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OAuthButtons } from "@/app/components/OAuthButtons";
import type { EnabledOAuthProviders } from "@/lib/oauth-config";

function AuthBrand() {
  return (
    <Link href="/" className="flex items-center justify-center gap-2.5 mb-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-lg font-bold">
        C
      </span>
      <span className="text-xl font-bold text-gray-900 dark:text-white">
        Cortala
      </span>
    </Link>
  );
}

function oauthErrorMessage(code: string | null): string | null {
  switch (code) {
    case "oauth_email_missing":
      return "Tu proveedor no compartió un correo. Configura un correo público en GitHub e inténtalo de nuevo.";
    case "oauth_link_failed":
      return "No se pudo vincular esta cuenta. Es posible que ese correo ya esté usando otro proveedor.";
    case "OAuthAccountNotLinked":
      return "Este correo ya existe con otro método. Inicia sesión con tu método original primero.";
    case null:
    case "":
      return null;
    default:
      return "No se pudo completar el inicio de sesión.";
  }
}

function FormBody({ enabled }: { enabled: EnabledOAuthProviders }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(oauthError ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (!result || result.error) {
      setError("Correo o contraseña incorrectos");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center p-6 outline-none"
    >
      <div className="w-full max-w-md card p-8">
        <AuthBrand />
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inicia sesión
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Accede a tus enlaces y estadísticas
          </p>
        </div>

        <OAuthButtons enabled={enabled} callbackUrl={callbackUrl} label="login" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3"
          >
            {isLoading ? "Procesando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}

export function LoginForm({ enabled }: { enabled: EnabledOAuthProviders }) {
  return (
    <Suspense fallback={null}>
      <FormBody enabled={enabled} />
    </Suspense>
  );
}

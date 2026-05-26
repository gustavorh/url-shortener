"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { scorePassword } from "@/lib/password-strength";
import { OAuthButtons } from "@/app/components/OAuthButtons";
import type { EnabledOAuthProviders } from "@/lib/oauth-config";

const STRENGTH_COLOR: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

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

export function RegisterForm({ enabled }: { enabled: EnabledOAuthProviders }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo crear la cuenta");
      }

      // Account created — sign in immediately.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        // Account exists; let the user sign in manually.
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la cuenta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md card p-8">
        <AuthBrand />
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Crea tu cuenta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus enlaces y mira sus estadísticas
          </p>
        </div>

        <OAuthButtons enabled={enabled} label="register" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Nombre <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            {password ? (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => {
                    const { score } = scorePassword(password);
                    return (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < score
                            ? STRENGTH_COLOR[score]
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Seguridad: {scorePassword(password).label}
                </p>
              </div>
            ) : (
              <p className="field-hint">Mínimo 8 caracteres</p>
            )}
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
            {isLoading ? "Procesando..." : "Crear cuenta"}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Al crear la cuenta aceptas los{" "}
            <Link
              href="/legal/terms"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/legal/privacy"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              política de privacidad
            </Link>
            .
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

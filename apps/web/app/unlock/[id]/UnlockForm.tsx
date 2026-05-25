"use client";

import { useEffect, useRef, useState, FormEvent } from "react";

// Password gate for a protected link. On success the API returns the
// destination and the browser navigates there.
export function UnlockForm({ id }: { id: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // The unlock page exists solely for this input — focus it on mount so
  // visitors can type immediately. Using a ref + effect avoids the
  // autoFocus prop, which assistive tech can announce unpredictably.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/links/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo abrir el enlace");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="unlock-password" className="sr-only">
        Contraseña del enlace
      </label>
      <input
        ref={inputRef}
        id="unlock-password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="input text-center"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3"
      >
        {isLoading ? "Comprobando..." : "Abrir enlace"}
      </button>
    </form>
  );
}

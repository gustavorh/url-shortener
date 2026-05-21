"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AppSidebar } from "../../components/AppSidebar";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await fetch("/api/account", { method: "DELETE" });
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email ?? "");
        setName(d.name ?? "");
        setUsername(d.username ?? "");
        setBio(d.bio ?? "");
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo guardar");
      }
      setStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <AppSidebar active="dashboard" />

      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← Volver al panel
          </Link>
          <h1 className="mt-4 mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Perfil público
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Define un nombre de usuario para tener una página link-in-bio
            pública con todos tus enlaces.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                Correo
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
              >
                Nombre para mostrar
              </label>
              <input
                id="name"
                type="text"
                value={name}
                maxLength={120}
                onChange={(e) => {
                  setName(e.target.value);
                  setStatus("idle");
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
              >
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                placeholder="mi-usuario"
                pattern="[a-zA-Z0-9_-]{3,32}"
                onChange={(e) => {
                  setUsername(e.target.value);
                  setStatus("idle");
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {username && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Tu página:{" "}
                  <Link
                    href={`/u/${username}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    /u/{username}
                  </Link>
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
              >
                Biografía
              </label>
              <textarea
                id="bio"
                value={bio}
                rows={3}
                maxLength={500}
                onChange={(e) => {
                  setBio(e.target.value);
                  setStatus("idle");
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "saving"}
              className="btn-primary"
            >
              {status === "saving"
                ? "Guardando..."
                : status === "saved"
                  ? "Guardado ✓"
                  : "Guardar perfil"}
            </button>
          </form>

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Tus datos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Descarga toda tu información o elimina tu cuenta de forma
              permanente.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/api/account/export"
                download
                className="py-2 px-4 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Descargar mis datos
              </a>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="py-2 px-4 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Eliminar mi cuenta
                </button>
              ) : (
                <span className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    Esto borra todo de forma permanente.
                  </span>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-70"
                  >
                    {deleting ? "Eliminando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-gray-500 dark:text-gray-400 hover:underline"
                  >
                    Cancelar
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

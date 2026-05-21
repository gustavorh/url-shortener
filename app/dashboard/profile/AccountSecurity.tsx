"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "saving" | "saved";

export function AccountSecurity() {
  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState<Status>("idle");
  const [emailError, setEmailError] = useState("");

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwStatus("saving");
    setPwError("");
    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "Error");
      }
      setPwStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Error");
      setPwStatus("idle");
    }
  };

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailStatus("saving");
    setEmailError("");
    try {
      const response = await fetch("/api/account/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          currentPassword: emailPassword,
        }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "Error");
      }
      setEmailStatus("saved");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Error");
      setEmailStatus("idle");
    }
  };

  return (
    <div className="mt-8 card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Seguridad
      </h2>

      <form onSubmit={changePassword} className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cambiar contraseña
        </p>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Contraseña actual"
          className="input"
        />
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nueva contraseña (mín. 8 caracteres)"
          className="input"
        />
        {pwError && (
          <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>
        )}
        <button
          type="submit"
          disabled={pwStatus === "saving"}
          className="btn-secondary"
        >
          {pwStatus === "saving"
            ? "Guardando..."
            : pwStatus === "saved"
              ? "Contraseña actualizada ✓"
              : "Actualizar contraseña"}
        </button>
      </form>

      <hr className="my-6 border-gray-100 dark:border-gray-700" />

      <form onSubmit={changeEmail} className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Cambiar correo
        </p>
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Nuevo correo electrónico"
          className="input"
        />
        <input
          type="password"
          required
          value={emailPassword}
          onChange={(e) => setEmailPassword(e.target.value)}
          placeholder="Confirma con tu contraseña"
          className="input"
        />
        {emailError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {emailError}
          </p>
        )}
        <button
          type="submit"
          disabled={emailStatus === "saving"}
          className="btn-secondary"
        >
          {emailStatus === "saving"
            ? "Guardando..."
            : emailStatus === "saved"
              ? "Correo actualizado ✓"
              : "Actualizar correo"}
        </button>
      </form>
    </div>
  );
}

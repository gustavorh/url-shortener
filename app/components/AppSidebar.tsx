"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type ActiveItem = "home" | "dashboard";

function navLinkClass(isActive: boolean): string {
  return isActive
    ? "flex items-center space-x-2 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
    : "flex items-center space-x-2 py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300";
}

export function AppSidebar({ active }: { active?: ActiveItem }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-md p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cortala
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tu acortador de URLs
          </p>
        </div>

        <div className="space-y-2">
          <Link href="/" className={navLinkClass(active === "home")}>
            <span>Inicio</span>
          </Link>
          <Link
            href="/dashboard"
            className={navLinkClass(active === "dashboard")}
          >
            <span>Mi panel</span>
          </Link>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-600 space-y-3">
          {status === "loading" ? null : user ? (
            <>
              <p
                className="text-sm text-gray-700 dark:text-gray-300 truncate"
                title={user.email ?? undefined}
              >
                {user.email}
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="block w-full text-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="block w-full text-center py-2 px-4 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Crear cuenta
              </Link>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Cortala
          </p>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Cortala
          </h2>
          <div className="flex space-x-4 items-center text-sm">
            <Link href="/" className="text-gray-700 dark:text-gray-300">
              Inicio
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-700 dark:text-gray-300"
            >
              Panel
            </Link>
            {user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 dark:text-red-400"
              >
                Salir
              </button>
            ) : (
              <Link
                href="/login"
                className="text-gray-900 dark:text-white font-medium"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type ActiveItem = "home" | "dashboard";

function LinkIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="12" y="8" width="3" height="10" />
      <rect x="17" y="4" width="3" height="14" />
    </svg>
  );
}

function navItemClass(isActive: boolean): string {
  return isActive
    ? "flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
    : "flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white transition-colors";
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
        <LinkIcon />
      </span>
      <span>
        <span className="block text-lg font-bold leading-none text-gray-900 dark:text-white">
          Cortala
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          Acortador de URLs
        </span>
      </span>
    </Link>
  );
}

export function AppSidebar({ active }: { active?: ActiveItem }) {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-5">
        <div className="px-1.5 mb-8">
          <Brand />
        </div>

        <div className="space-y-1">
          <Link href="/" className={navItemClass(active === "home")}>
            <HomeIcon />
            <span>Inicio</span>
          </Link>
          <Link
            href="/dashboard"
            className={navItemClass(active === "dashboard")}
          >
            <ChartIcon />
            <span>Mi panel</span>
          </Link>
        </div>

        <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
          {status === "loading" ? null : user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold">
                  {(user.email ?? "?").charAt(0).toUpperCase()}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300"
                  title={user.email ?? undefined}
                >
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-1.5 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className="btn-primary w-full">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-secondary w-full">
                Crear cuenta
              </Link>
            </div>
          )}
          <p className="mt-4 px-1.5 text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Cortala
          </p>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 font-medium"
            >
              Panel
            </Link>
            {user ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-gray-500 dark:text-gray-400"
              >
                Salir
              </button>
            ) : (
              <Link
                href="/login"
                className="font-medium text-indigo-600 dark:text-indigo-400"
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatNotification, relativeTimeEs } from "@/lib/notifications-format";
import type { NotificationType } from "@/models/notification";

interface NotificationItem {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

const POLL_MS = 30_000;
const LIST_LIMIT = 10;

function BellIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationBell() {
  const { status } = useSession();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { unread?: number };
      if (typeof data.unread === "number") setUnread(data.unread);
    } catch {
      // network errors are silent — the next poll will retry
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/notifications?limit=${LIST_LIMIT}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications?: NotificationItem[] };
      setItems(data.notifications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Polling lifecycle: only when logged in and the tab is visible.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const start = () => {
      if (timerRef.current) return;
      // immediate fetch when (re)starting so the badge reflects current state
      void fetchCount();
      timerRef.current = setInterval(() => {
        if (!cancelled) void fetchCount();
      }, POLL_MS);
    };
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, fetchCount]);

  // Click-outside to dismiss the dropdown.
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) void fetchList();
      return next;
    });
  };

  const markOne = async (id: string) => {
    setItems((prev) =>
      prev?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) ?? prev
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {
      // optimistic update remains; the next poll will reconcile
    }
  };

  const markAll = async () => {
    setItems((prev) =>
      prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? prev
    );
    setUnread(0);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // see above
    }
  };

  if (status !== "authenticated") return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={
          unread > 0
            ? `Notificaciones (${unread} sin leer)`
            : "Notificaciones"
        }
        className="relative grid h-9 w-9 place-items-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <BellIcon filled={unread > 0} />
        {unread > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones recientes"
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-30"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Marcar todas
              </button>
            )}
          </div>

          {loadingItems && items === null && (
            <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              Cargando…
            </p>
          )}
          {items && items.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              No tienes notificaciones todavía.
            </p>
          )}
          {items && items.length > 0 && (
            <ul>
              {items.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <li
                    key={n.id}
                    className={
                      isUnread
                        ? "px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 bg-indigo-50/40 dark:bg-indigo-500/5"
                        : "px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                    }
                  >
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {formatNotification(n.type, n.payload)}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{relativeTimeEs(n.createdAt)}</span>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markOne(n.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Marcar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

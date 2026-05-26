"use client";

import Link from "next/link";
import { useState } from "react";
import { formatNotification, relativeTimeEs } from "@/lib/notifications-format";
import type { NotificationType } from "@/models/notification";

interface NotificationItem {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

interface Props {
  initialItems: NotificationItem[];
  page: number;
  pageSize: number;
}

export function NotificationsList({ initialItems, page, pageSize }: Props) {
  const [items, setItems] = useState<NotificationItem[]>(initialItems);

  const hasUnread = items.some((n) => !n.readAt);

  const markOne = async (id: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {
      // optimistic — leave the UI updated
    }
  };

  const markAll = async () => {
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // see above
    }
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={markAll}
          disabled={!hasUnread}
          className="btn-secondary disabled:opacity-50"
        >
          Marcar todas como leídas
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No tienes notificaciones todavía.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul>
            {items.map((n) => {
              const unread = !n.readAt;
              return (
                <li
                  key={n.id}
                  className={
                    unread
                      ? "px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0 bg-indigo-50/40 dark:bg-indigo-500/5"
                      : "px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {formatNotification(n.type, n.payload)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {relativeTimeEs(n.createdAt)}
                      </p>
                    </div>
                    {unread && (
                      <button
                        type="button"
                        onClick={() => markOne(n.id)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-between text-sm">
        {page > 1 ? (
          <Link
            href={`/dashboard/notifications?page=${page - 1}`}
            className="btn-secondary"
          >
            ← Anterior
          </Link>
        ) : (
          <span className="btn-secondary opacity-50 pointer-events-none">
            ← Anterior
          </span>
        )}
        {items.length === pageSize ? (
          <Link
            href={`/dashboard/notifications?page=${page + 1}`}
            className="btn-secondary"
          >
            Siguiente →
          </Link>
        ) : (
          <span className="btn-secondary opacity-50 pointer-events-none">
            Siguiente →
          </span>
        )}
      </div>
    </>
  );
}

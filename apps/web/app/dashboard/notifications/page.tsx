import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/app/components/AppSidebar";
import {
  countUnread,
  listNotifications,
} from "@/lib/notifications-service";
import { NotificationsList } from "./NotificationsList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const userId = session.user.id;
  const [rows, unread] = await Promise.all([
    listNotifications(userId, { limit: PAGE_SIZE, offset }),
    countUnread(userId),
  ]);

  const initialItems = rows.map((n) => ({
    id: n.id,
    type: n.type,
    payload: n.payload,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="dashboard" />
      <main className="flex-1 px-6 py-10 md:px-12 md:py-12 mt-14 md:mt-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notificaciones
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {unread > 0
                  ? `${unread} sin leer`
                  : "Estás al día"}
              </p>
            </div>
          </div>

          <NotificationsList
            initialItems={initialItems}
            page={page}
            pageSize={PAGE_SIZE}
          />
        </div>
      </main>
    </div>
  );
}

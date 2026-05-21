import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { Url } from "@/models";
import { getLinkStats, getRecentClicks } from "@/lib/stats-queries";
import { AppSidebar } from "../../components/AppSidebar";
import { StatsCharts } from "./StatsCharts";
import { LinkTargetsManager } from "./LinkTargetsManager";
import { QrCustomizer } from "./QrCustomizer";
import { LinkEditor } from "./LinkEditor";
import { DeleteLinkButton } from "./DeleteLinkButton";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const url = await Url.findByPk(id, { raw: true });
  // Ownership check. Use notFound() rather than a 403 so the existence of
  // another user's link is not revealed. Soft-deleted links are also hidden.
  if (!url || url.userId !== session.user.id || url.deletedAt) {
    notFound();
  }

  const stats = await getLinkStats(id);
  const recentClicks = await getRecentClicks(id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const isExpired = url.expirationDate
    ? new Date() > new Date(url.expirationDate)
    : false;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <AppSidebar active="dashboard" />

      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              ← Volver al panel
            </Link>
            <div className="flex items-center gap-4">
              <a
                href={`/api/links/${id}/export`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                Exportar CSV
              </a>
              <DeleteLinkButton linkId={id} />
            </div>
          </div>

          <div className="mt-4 mb-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <a
                  href={`${baseUrl}/${url.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  /{url.id}
                </a>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate"
                  title={url.originalUrl}
                >
                  → {url.originalUrl}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Creado el{" "}
                  {format(new Date(url.creationDate), "yyyy-MM-dd HH:mm")}
                  {url.expirationDate && (
                    <>
                      {" · "}
                      {isExpired ? "Expiró el " : "Expira el "}
                      {format(
                        new Date(url.expirationDate),
                        "yyyy-MM-dd HH:mm"
                      )}
                    </>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  clic{stats.total === 1 ? "" : "s"} en total
                </p>
              </div>
            </div>

          </div>

          <div className="space-y-6 mb-6">
            <LinkEditor
              linkId={id}
              initialTitle={url.title ?? null}
              initialUrl={url.originalUrl}
              initialExpiration={
                url.expirationDate
                  ? format(new Date(url.expirationDate), "yyyy-MM-dd'T'HH:mm")
                  : null
              }
              initialTags={url.tags ?? null}
              initialMaxClicks={url.maxClicks ?? null}
            />
            <LinkTargetsManager linkId={id} />
            <QrCustomizer linkId={id} />
          </div>

          <StatsCharts stats={stats} />

          <div className="card mt-6 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 p-5 pb-3">
              Clics recientes
            </h3>
            {recentClicks.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">
                Sin clics todavía.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-5 py-2 font-medium">Fecha</th>
                      <th className="px-5 py-2 font-medium">País</th>
                      <th className="px-5 py-2 font-medium">Dispositivo</th>
                      <th className="px-5 py-2 font-medium">Navegador</th>
                      <th className="px-5 py-2 font-medium">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClicks.map((click, index) => (
                      <tr
                        key={`${click.timestamp}-${index}`}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <td className="px-5 py-2 text-gray-600 dark:text-gray-300">
                          {format(
                            new Date(click.timestamp),
                            "yyyy-MM-dd HH:mm"
                          )}
                        </td>
                        <td className="px-5 py-2 text-gray-600 dark:text-gray-300">
                          {click.country ?? "—"}
                        </td>
                        <td className="px-5 py-2 text-gray-600 dark:text-gray-300">
                          {click.deviceType ?? "—"}
                        </td>
                        <td className="px-5 py-2 text-gray-600 dark:text-gray-300">
                          {click.browser ?? "—"}
                        </td>
                        <td className="px-5 py-2 max-w-xs truncate text-gray-600 dark:text-gray-300">
                          {click.referrer ?? "Directo"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

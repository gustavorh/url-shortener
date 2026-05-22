import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { Url } from "@/models";
import { getLinkStats, getRecentClicks } from "@/lib/stats-queries";
import { countryFlag } from "@/lib/country";
import { AppSidebar } from "../../components/AppSidebar";
import { StatsCharts } from "./StatsCharts";
import { LinkTargetsManager } from "./LinkTargetsManager";
import { QrCustomizer } from "./QrCustomizer";
import { LinkEditor } from "./LinkEditor";
import { DeleteLinkButton } from "./DeleteLinkButton";

export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "7d", label: "7 días", days: 7 },
  { key: "30d", label: "30 días", days: 30 },
  { key: "all", label: "Todo", days: 0 },
] as const;

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  const { period: periodParam } = await searchParams;

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

  const period =
    PERIODS.find((p) => p.key === periodParam) ?? PERIODS[2];
  const since =
    period.days > 0
      ? new Date(Date.now() - period.days * 24 * 60 * 60 * 1000)
      : undefined;

  const stats = await getLinkStats(id, since);
  // Prefix country labels with their flag emoji for the chart.
  stats.byCountry = stats.byCountry.map((entry) => ({
    label: `${countryFlag(entry.label)} ${entry.label}`.trim(),
    count: entry.count,
  }));
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
                {url.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {url.description}
                  </p>
                )}
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
              initialDisabled={!!url.disabled}
              initialActiveFrom={
                url.activeFrom
                  ? format(new Date(url.activeFrom), "yyyy-MM-dd'T'HH:mm")
                  : null
              }
              initialDescription={url.description ?? null}
            />
            <LinkTargetsManager linkId={id} />
            <QrCustomizer linkId={id} />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">
              Periodo:
            </span>
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={`/stats/${id}?period=${p.key}`}
                className={
                  p.key === period.key
                    ? "px-3 py-1 rounded-full text-sm font-medium bg-indigo-600 text-white"
                    : "px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }
              >
                {p.label}
              </Link>
            ))}
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
                          {click.country
                            ? `${countryFlag(click.country)} ${click.country}`
                            : "—"}
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

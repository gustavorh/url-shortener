import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Op, type WhereOptions } from "sequelize";
import { auth } from "@/auth";
import { Url } from "@/models";
import { getClickCounts, getUserTotals } from "@/lib/stats-queries";
import { splitTags } from "@/lib/tags";
import { faviconUrl } from "@/lib/favicon";
import { relativeTime } from "@/lib/format-date";
import { linkStatus, type LinkStatus } from "@/lib/link-status";
import { AppSidebar } from "../components/AppSidebar";
import { CopyButton } from "../components/CopyButton";
import { DashboardControls } from "./DashboardControls";

const STATUS_BADGE: Record<LinkStatus, { label: string; className: string }> = {
  active: { label: "", className: "" },
  disabled: {
    label: "Pausado",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  scheduled: {
    label: "Programado",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  expired: {
    label: "Expirado",
    className: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  },
  limit: {
    label: "Límite",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

// Always reflect the latest links/clicks.
export const dynamic = "force-dynamic";

type SortOption = "recent" | "oldest" | "clicks";
const PAGE_SIZE = 20;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
    tag?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const tag = (params.tag ?? "").trim().toLowerCase();
  const sort: SortOption =
    params.sort === "oldest" || params.sort === "clicks"
      ? params.sort
      : "recent";
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const where: WhereOptions = { userId: session.user.id, deletedAt: null };
  if (query) {
    const term = `%${query}%`;
    Object.assign(where, {
      [Op.or]: [
        { id: { [Op.like]: term } },
        { originalUrl: { [Op.like]: term } },
        { title: { [Op.like]: term } },
      ],
    });
  }
  // Loose substring match — adequate for the small per-user tag space.
  if (tag) {
    Object.assign(where, { tags: { [Op.like]: `%${tag}%` } });
  }

  let urls;
  let total: number;
  let clickCounts: Map<string, number>;

  if (sort === "clicks") {
    // Click counts live in another table, so sort/paginate in memory.
    const all = await Url.findAll({ where, raw: true });
    clickCounts = await getClickCounts(all.map((url) => url.id));
    all.sort(
      (a, b) => (clickCounts.get(b.id) ?? 0) - (clickCounts.get(a.id) ?? 0)
    );
    total = all.length;
    urls = all.slice(offset, offset + PAGE_SIZE);
  } else {
    total = await Url.count({ where });
    urls = await Url.findAll({
      where,
      order: [["creationDate", sort === "oldest" ? "ASC" : "DESC"]],
      limit: PAGE_SIZE,
      offset,
      raw: true,
    });
    clickCounts = await getClickCounts(urls.map((url) => url.id));
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totals = await getUserTotals(session.user.id);
  const avgClicks =
    totals.links > 0 ? Math.round(totals.clicks / totals.links) : 0;

  const pageHref = (target: number) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (tag) qs.set("tag", tag);
    if (sort !== "recent") qs.set("sort", sort);
    if (target > 1) qs.set("page", String(target));
    const s = qs.toString();
    return s ? `/dashboard?${s}` : "/dashboard";
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="dashboard" />

      <main className="flex-1 px-6 py-10 md:px-12 md:py-12 mt-14 md:mt-0">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mi panel
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {total} enlace{total === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/profile" className="btn-secondary">
                Perfil público
              </Link>
              <Link href="/dashboard/keys" className="btn-secondary">
                Claves de API
              </Link>
              <Link href="/dashboard/import" className="btn-secondary">
                Importar URLs
              </Link>
              <a
                href="/api/links/export-all"
                download
                className="btn-secondary"
              >
                Exportar CSV
              </a>
            </div>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Enlaces", value: totals.links },
              { label: "Clics totales", value: totals.clicks },
              { label: "Clics por enlace", value: avgClicks },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <DashboardControls query={query} sort={sort} tag={tag} />

          {tag && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Filtrando por etiqueta:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                #{tag}
                <Link href="/dashboard" className="hover:text-indigo-900 dark:hover:text-indigo-100">
                  ✕
                </Link>
              </span>
            </div>
          )}

          {urls.length === 0 ? (
            <div className="card p-10 text-center mt-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {query || tag
                  ? "Sin resultados para este filtro."
                  : "Aún no tienes enlaces. Crea el primero desde el inicio."}
              </p>
              {!query && !tag && (
                <Link href="/" className="btn-primary">
                  Acortar una URL
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="card overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Enlace corto</th>
                      <th className="p-4 font-medium">Destino</th>
                      <th className="p-4 font-medium text-right">Clics</th>
                      <th className="p-4 font-medium">Creado</th>
                      <th className="p-4 font-medium">Expira</th>
                      <th className="p-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((url) => {
                      const tags = splitTags(url.tags);
                      const status = linkStatus(
                        url,
                        clickCounts.get(url.id) ?? 0
                      );
                      const badge = STATUS_BADGE[status];
                      return (
                        <tr
                          key={url.id}
                          className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <a
                                href={`${baseUrl}/${url.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                              >
                                /{url.id}
                              </a>
                              <CopyButton value={`${baseUrl}/${url.id}`} />
                              {badge.label && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 max-w-xs text-gray-600 dark:text-gray-300">
                            <a
                              href={url.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 truncate hover:underline"
                              title={url.originalUrl}
                            >
                              {faviconUrl(url.originalUrl) && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={faviconUrl(url.originalUrl)!}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="shrink-0 rounded-sm"
                                />
                              )}
                              <span className="truncate">
                                {url.title || url.originalUrl}
                              </span>
                            </a>
                            {tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {tags.map((t) => (
                                  <Link
                                    key={t}
                                    href={`/dashboard?tag=${encodeURIComponent(t)}`}
                                    className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
                                  >
                                    #{t}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                            {clickCounts.get(url.id) ?? 0}
                          </td>
                          <td
                            className="p-4 text-gray-500 dark:text-gray-400"
                            title={format(
                              new Date(url.creationDate),
                              "yyyy-MM-dd HH:mm"
                            )}
                          >
                            {relativeTime(url.creationDate)}
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">
                            {url.expirationDate
                              ? format(
                                  new Date(url.expirationDate),
                                  "yyyy-MM-dd HH:mm"
                                )
                              : "—"}
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/stats/${url.id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                              Estadísticas
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 ? (
                      <Link href={pageHref(page - 1)} className="btn-secondary">
                        ← Anterior
                      </Link>
                    ) : (
                      <span className="btn-secondary opacity-50 pointer-events-none">
                        ← Anterior
                      </span>
                    )}
                    {page < totalPages ? (
                      <Link href={pageHref(page + 1)} className="btn-secondary">
                        Siguiente →
                      </Link>
                    ) : (
                      <span className="btn-secondary opacity-50 pointer-events-none">
                        Siguiente →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

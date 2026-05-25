import Link from "next/link";
import { redirect } from "next/navigation";
import { Op, type WhereOptions } from "sequelize";
import { auth } from "@/auth";
import { Url } from "@/models";
import { getClickCounts, getUserTotals } from "@/lib/stats-queries";
import { splitTags } from "@/lib/tags";
import { AppSidebar } from "../components/AppSidebar";
import { DashboardControls } from "./DashboardControls";
import { LinkTable, type LinkRow } from "./LinkTable";

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

  // Distinct tags across all the user's links, for the filter cloud.
  const tagRows = await Url.findAll({
    where: { userId: session.user.id, deletedAt: null },
    attributes: ["tags"],
    raw: true,
  });
  const allTags = [
    ...new Set(tagRows.flatMap((row) => splitTags(row.tags))),
  ].sort();

  const pageHref = (target: number) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (tag) qs.set("tag", tag);
    if (sort !== "recent") qs.set("sort", sort);
    if (target > 1) qs.set("page", String(target));
    const s = qs.toString();
    return s ? `/dashboard?${s}` : "/dashboard";
  };

  // Export honors the active search/tag filter.
  const exportQs = new URLSearchParams();
  if (query) exportQs.set("q", query);
  if (tag) exportQs.set("tag", tag);
  const exportHref = exportQs.toString()
    ? `/api/links/export-all?${exportQs}`
    : "/api/links/export-all";

  return (
    <div className="flex min-h-screen">
      <AppSidebar active="dashboard" />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-6 py-10 md:px-12 md:py-12 mt-14 md:mt-0 outline-none"
      >
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
                href={exportHref}
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

          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <Link
                  key={t}
                  href={`/dashboard?tag=${encodeURIComponent(t)}`}
                  className={
                    t === tag
                      ? "px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white"
                      : "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
                  }
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

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
              {query || tag ? (
                <Link href="/dashboard" className="btn-secondary">
                  Limpiar filtros
                </Link>
              ) : (
                <Link href="/" className="btn-primary">
                  Acortar una URL
                </Link>
              )}
            </div>
          ) : (
            <>
              {(() => {
                // Serialize the Sequelize rows into a plain shape that
                // can cross the server → client component boundary.
                // Dates become ISO strings; click counts get folded in.
                const rows: LinkRow[] = urls.map((url) => ({
                  id: url.id,
                  originalUrl: url.originalUrl,
                  title: url.title ?? null,
                  tags: url.tags ?? null,
                  clicks: clickCounts.get(url.id) ?? 0,
                  disabled: !!url.disabled,
                  creationDate: new Date(url.creationDate).toISOString(),
                  expirationDate: url.expirationDate
                    ? new Date(url.expirationDate).toISOString()
                    : null,
                  activeFrom: url.activeFrom
                    ? new Date(url.activeFrom).toISOString()
                    : null,
                  maxClicks: url.maxClicks ?? null,
                }));
                return <LinkTable links={rows} baseUrl={baseUrl} />;
              })()}

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

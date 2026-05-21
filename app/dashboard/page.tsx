import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Op, type WhereOptions } from "sequelize";
import { auth } from "@/auth";
import { Url } from "@/models";
import { getClickCounts } from "@/lib/stats-queries";
import { AppSidebar } from "../components/AppSidebar";
import { DashboardControls } from "./DashboardControls";

// Always reflect the latest links/clicks.
export const dynamic = "force-dynamic";

type SortOption = "recent" | "oldest" | "clicks";
const PAGE_SIZE = 20;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
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

  const pageHref = (target: number) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
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
            </div>
          </div>

          <DashboardControls query={query} sort={sort} />

          {urls.length === 0 ? (
            <div className="card p-10 text-center mt-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {query
                  ? `Sin resultados para “${query}”.`
                  : "Aún no tienes enlaces. Crea el primero desde el inicio."}
              </p>
              {!query && (
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
                    {urls.map((url) => (
                      <tr
                        key={url.id}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="p-4">
                          <a
                            href={`${baseUrl}/${url.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            /{url.id}
                          </a>
                        </td>
                        <td className="p-4 max-w-xs truncate text-gray-600 dark:text-gray-300">
                          <a
                            href={url.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            title={url.originalUrl}
                          >
                            {url.title || url.originalUrl}
                          </a>
                        </td>
                        <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                          {clickCounts.get(url.id) ?? 0}
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">
                          {format(
                            new Date(url.creationDate),
                            "yyyy-MM-dd HH:mm"
                          )}
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
                    ))}
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

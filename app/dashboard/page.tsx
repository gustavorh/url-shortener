import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { Url } from "@/models";
import { getClickCounts } from "@/lib/stats-queries";
import { AppSidebar } from "../components/AppSidebar";

// Always reflect the latest links/clicks.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const urls = await Url.findAll({
    where: { userId: session.user.id },
    order: [["creationDate", "DESC"]],
    raw: true,
  });
  const clickCounts = await getClickCounts(urls.map((url) => url.id));
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      <AppSidebar active="dashboard" />

      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mi panel
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {urls.length} enlace{urls.length === 1 ? "" : "s"} ·{" "}
                {[...clickCounts.values()].reduce((a, b) => a + b, 0)} clics en
                total
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/keys"
                className="py-2 px-4 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Claves de API
              </Link>
              <Link
                href="/dashboard/import"
                className="py-2 px-4 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Importar URLs
              </Link>
            </div>
          </div>

          {urls.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Aún no tienes enlaces. Crea el primero desde el inicio.
              </p>
              <Link
                href="/"
                className="inline-block py-2 px-4 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
              >
                Acortar una URL
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-x-auto">
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
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                    >
                      <td className="p-4">
                        <a
                          href={`${baseUrl}/${url.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          /{url.id}
                        </a>
                      </td>
                      <td className="p-4 max-w-xs truncate text-gray-700 dark:text-gray-300">
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          title={url.originalUrl}
                        >
                          {url.originalUrl}
                        </a>
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                        {clickCounts.get(url.id) ?? 0}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {format(new Date(url.creationDate), "yyyy-MM-dd HH:mm")}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
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
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Estadísticas
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

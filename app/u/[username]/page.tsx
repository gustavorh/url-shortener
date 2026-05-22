import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Op } from "sequelize";
import { User, Url } from "@/models";

export const dynamic = "force-dynamic";

async function findUser(username: string) {
  return User.findOne({ where: { username }, raw: true });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return { title: "Perfil no encontrado · Cortala" };
  return {
    title: `${user.name || user.username} · Cortala`,
    description: user.bio || `Enlaces de ${user.name || user.username}`,
  };
}

// Public link-in-bio page: /u/[username]
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) {
    notFound();
  }

  const now = new Date();
  const links = await Url.findAll({
    where: {
      userId: user.id,
      deletedAt: null,
      [Op.or]: [
        { expirationDate: null },
        { expirationDate: { [Op.gt]: now } },
      ],
    },
    order: [["creationDate", "DESC"]],
    raw: true,
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const displayName = user.name || user.username || "Cortala";

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h1>
          {user.bio && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">{user.bio}</p>
          )}
        </div>

        {links.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Todavía no hay enlaces públicos.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={`${baseUrl}/${link.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card block p-4 text-center text-gray-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <span className="font-medium">
                  {link.title || link.originalUrl}
                </span>
                {link.description && (
                  <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
                    {link.description}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-gray-400 dark:text-gray-500">
          Creado con Cortala
        </p>
      </div>
    </div>
  );
}

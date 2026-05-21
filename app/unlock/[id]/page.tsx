import { notFound, redirect } from "next/navigation";
import { Url } from "@/models";
import { UnlockForm } from "./UnlockForm";

export const dynamic = "force-dynamic";

// Password gate for a protected link (/unlock/[id]).
export default async function UnlockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await Url.findByPk(id, { raw: true });

  if (!link || link.deletedAt) {
    notFound();
  }
  // Not protected — send the visitor straight through.
  if (!link.passwordHash) {
    redirect(`/${id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm card p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 grid place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Enlace protegido
        </h1>
        <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
          Introduce la contraseña para continuar.
        </p>
        <UnlockForm id={id} />
      </div>
    </div>
  );
}

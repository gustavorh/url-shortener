import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center p-6 outline-none"
    >
      <div className="w-full max-w-md card p-10 text-center">
        <p className="text-5xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
          Página no encontrada
        </h1>
        <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
          El enlace que buscas no existe o ya no está disponible.
        </p>
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

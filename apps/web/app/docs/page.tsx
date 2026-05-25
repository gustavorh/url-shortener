import type { Metadata } from "next";
import { SwaggerUI } from "./SwaggerUI";

export const metadata: Metadata = {
  title: "API · Cortala",
  description:
    "Documentación interactiva de la API REST pública de Cortala (OpenAPI 3.1).",
  robots: { index: true, follow: false },
};

// Static OpenAPI 3.1 docs. The spec is generated from the shared Zod
// schemas by scripts/generate-openapi.ts and committed to public/, so
// /docs renders the exact same shapes the API actually validates.
export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Cortala API
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          OpenAPI 3.1 — autentícate con una{" "}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
            Authorization: Bearer crtl_…
          </code>{" "}
          generada en el panel.
        </p>
      </header>
      <SwaggerUI specUrl="/openapi.json" />
    </div>
  );
}

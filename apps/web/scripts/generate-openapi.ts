// Builds apps/web/public/openapi.json from the shared Zod schemas. Runs
// as a build step (or manually via `pnpm openapi:generate`) — never at
// runtime, so the production bundle stays free of @asteasolutions/...
//
// CI compares the generated file against the committed one and fails the
// build if they diverge (see .github/workflows/ci.yml). That keeps the API
// surface and the docs in lockstep without anyone having to remember.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function main(): Promise<void> {
  // Dynamic imports so we can patch Zod's prototype BEFORE any schema
  // instance is constructed by the workspace package.
  const zodModule = await import("zod");
  const { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } =
    await import("@asteasolutions/zod-to-openapi");
  extendZodWithOpenApi(zodModule.z);
  const z = zodModule.z;

  const {
    CreateLinkBodySchema,
    ListLinksResponseSchema,
    LinkDetailSchema,
    CreatedLinkSchema,
    LinkStatsResponseSchema,
    MeResponseSchema,
    ApiErrorSchema,
  } = await import("@cortala/schemas/v1");

  const registry = new OpenAPIRegistry();

  const CreateLink = registry.register("CreateLinkBody", CreateLinkBodySchema);
  const CreatedLink = registry.register("CreatedLink", CreatedLinkSchema);
  const LinkDetail = registry.register("LinkDetail", LinkDetailSchema);
  const LinkList = registry.register(
    "ListLinksResponse",
    ListLinksResponseSchema
  );
  const LinkStats = registry.register(
    "LinkStatsResponse",
    LinkStatsResponseSchema
  );
  const Me = registry.register("MeResponse", MeResponseSchema);
  const ApiError = registry.register("ApiError", ApiErrorSchema);

  registry.registerComponent("securitySchemes", "apiKey", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "crtl_...",
    description:
      "API key obtained from the Cortala dashboard. Send as `Authorization: Bearer <key>`.",
  });

  const apiError = (description: string) => ({
    description,
    content: { "application/json": { schema: ApiError } },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/me",
    summary: "Cuenta autenticada y totales.",
    tags: ["account"],
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: Me } },
      },
      401: apiError("API key inválida o ausente"),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/links",
    summary: "Lista los enlaces del autenticado, paginados.",
    tags: ["links"],
    security: [{ apiKey: [] }],
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).default(0),
        search: z.string().optional(),
        tag: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: LinkList } },
      },
      401: apiError("API key inválida o ausente"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/links",
    summary: "Crea un enlace corto.",
    tags: ["links"],
    security: [{ apiKey: [] }],
    request: {
      body: {
        required: true,
        content: { "application/json": { schema: CreateLink } },
      },
    },
    responses: {
      201: {
        description: "Creado",
        content: { "application/json": { schema: CreatedLink } },
      },
      400: apiError("Datos inválidos"),
      401: apiError("API key inválida o ausente"),
      409: apiError("Alias ya en uso"),
      429: apiError("Límite de solicitudes alcanzado"),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/links/{id}",
    summary: "Detalle de un enlace propio.",
    tags: ["links"],
    security: [{ apiKey: [] }],
    request: {
      params: z.object({ id: z.string().min(1) }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: LinkDetail } },
      },
      401: apiError("API key inválida o ausente"),
      404: apiError("Enlace no encontrado"),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/links/{id}/stats",
    summary: "Analítica completa de un enlace.",
    tags: ["links"],
    security: [{ apiKey: [] }],
    request: {
      params: z.object({ id: z.string().min(1) }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: LinkStats } },
      },
      401: apiError("API key inválida o ausente"),
      404: apiError("Enlace no encontrado"),
    },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);
  const document = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Cortala API",
      version: "1.0.0",
      description:
        "REST API pública del acortador Cortala. Autentícate con una API key creada en el panel.",
    },
    servers: [
      {
        url: "https://cortala.example.com",
        description: "Producción (sustituye por tu propio dominio).",
      },
      {
        url: "http://localhost:3000",
        description: "Desarrollo local.",
      },
    ],
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(__dirname, "../public/openapi.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2) + "\n", "utf8");
  console.log(
    `[openapi] wrote ${outPath} (${Object.keys(document.paths ?? {}).length} paths)`
  );
}

main().catch((err) => {
  console.error("[openapi] generation failed:", err);
  process.exit(1);
});

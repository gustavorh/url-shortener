<div align="center">

# 🔗 Cortala

**Acortador de URLs full-stack con analítica, API pública y panel de control.**

Un proyecto que demuestra arquitectura de sistemas y dominio del stack moderno de TypeScript.

[![CI](https://github.com/gustavorh/url-shortener/actions/workflows/ci.yml/badge.svg)](https://github.com/gustavorh/url-shortener/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)

</div>

---

## ✨ Características

**Acortado de enlaces**
- Códigos generados (hash MD5 → Base62) o **alias personalizados**
- Fecha de **expiración** y **límite de clics** opcionales
- **Protección con contraseña** (página de desbloqueo dedicada)
- **Acortado masivo** por CSV y **constructor de UTM** para campañas

**Cuentas y analítica**
- Autenticación con Auth.js (sesiones JWT, contraseñas con bcrypt)
- **Panel personal** con búsqueda, orden, paginación y tarjetas de resumen
- **Edición de enlaces** (destino, expiración, etiquetas, estado)
- **Etiquetas** para organizar y filtrar enlaces
- **Analítica por enlace**: serie temporal, dispositivos, navegadores,
  países (geo-IP), orígenes y feed de clics recientes
- **Exportación CSV** de los clics y de todos los enlaces
- **Códigos QR** personalizables (color, PNG o SVG) y descargables

**Destinos inteligentes**
- **Redirección por dispositivo** (iOS / Android / escritorio)
- **Rotación A/B** de varios destinos con seguimiento de variante
- **Pausar y reactivar** enlaces sin eliminarlos

**Cuenta y experiencia**
- **Gestión de cuenta**: cambio de contraseña y de correo
- Tema **claro / oscuro / sistema** con preferencia recordada
- Estados de carga, página 404 propia y detección de URLs duplicadas

**Plataforma**
- **API REST pública** v1 autenticada con API keys
- Páginas **link-in-bio** públicas (`/u/usuario`)
- **Caché Redis** opcional para la ruta de redirección

**Operación y cumplimiento**
- Endpoints de **health check** y **métricas Prometheus**
- **Rate limiting** (distribuido con Redis o en memoria)
- Protección **SSRF** y escaneo de URLs maliciosas (Safe Browsing)
- **GDPR**: anonimización de IP, soft-delete, export y borrado de cuenta

## 🏗️ Arquitectura

Aplicación monolítica de Next.js (App Router): frontend y API en el mismo
despliegue. Detalle completo en **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

```
                    ┌──────────────────────────────┐
   navegador  ─────▶│  Next.js (App Router)         │
   API client ─────▶│  páginas SSR · route handlers │
                    └──────────────┬───────────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 ▼                 ▼                 ▼
          ┌────────────┐   ┌──────────────┐   ┌────────────┐
          │   MySQL     │   │  Redis        │   │  APIs ext. │
          │ (Sequelize) │   │ (caché + RL,  │   │ Safe       │
          │             │   │  opcional)    │   │ Browsing   │
          └────────────┘   └──────────────┘   └────────────┘
```

## 🧰 Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 15 · React 19 · TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Datos | MySQL · Sequelize 6 · migraciones con `sequelize-cli` |
| Auth | Auth.js (next-auth v5) · `bcryptjs` |
| Caché / colas | Redis (`ioredis`) · BullMQ (cola de clics) — opcional |
| Observabilidad | `prom-client` (métricas Prometheus) |
| Gráficos | Recharts |
| Tests | Vitest (unitarios + integración) · GitHub Actions |

## 🚀 Puesta en marcha

```bash
# 1. Dependencias (pnpm workspaces — instala todo el monorepo)
pnpm install

# 2. Variables de entorno (la web app las lee desde apps/web/.env)
cp apps/web/.env.example apps/web/.env
openssl rand -base64 32      # pega el valor en AUTH_SECRET

# 3. Base de datos (crea la BD en MySQL y aplica las migraciones)
pnpm db:migrate

# 4. Desarrollo
pnpm dev                     # http://localhost:3000

# 5. (opcional) Worker BullMQ para ingestión asíncrona de clics
pnpm worker                  # requiere REDIS_URL configurado
```

## 📜 Scripts

| Script | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` / `start` | Build y arranque en producción |
| `pnpm lint` / `typecheck` | Linting y chequeo de tipos |
| `pnpm test` | Tests en modo watch |
| `pnpm test:unit` / `test:integration` | Unitarios / integración |
| `pnpm worker` / `worker:dev` | Worker BullMQ que procesa la cola de clics |
| `pnpm db:migrate` / `db:migrate:undo` | Aplicar / revertir migraciones |

## 🔌 API pública REST

Genera una clave en **Mi panel → Claves de API** y autentícate con
`Authorization: Bearer <clave>`.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/me` | Tu cuenta y totales |
| `POST` | `/api/v1/links` | Crea un enlace |
| `GET` | `/api/v1/links` | Lista tus enlaces (`?limit=&offset=&search=&tag=`) |
| `GET` | `/api/v1/links/:id` | Detalle de un enlace |
| `GET` | `/api/v1/links/:id/stats` | Analítica de un enlace |

Documentación interactiva en **`/docs`** (OpenAPI 3.1 + Swagger UI). El
spec se genera desde los schemas Zod compartidos con
`pnpm openapi:generate` y CI bloquea cualquier drift entre el spec
comiteado y los schemas actuales.

```bash
curl -X POST https://tu-dominio/api/v1/links \
  -H "Authorization: Bearer crtl_..." \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com"}'
```

## 🔔 Webhooks

Crea un webhook en **Mi panel → Webhooks**. Recibirás un POST firmado en
tu URL cada vez que ocurra alguno de los eventos suscritos (`link.created`,
`link.clicked`, `link.expired`, `link.limit_reached`).

**Verificar la firma** (Node.js / ejemplo):

```ts
import crypto from "node:crypto";

function verify(rawBody: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("="))
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(parts.v1, "hex")
  );
}
```

El worker que entrega los webhooks se arranca con `pnpm webhook-worker`
y requiere `REDIS_URL` configurado. En producción corre como un proceso
aparte (PM2, systemd, contenedor independiente).

## 🖥️ CLI

`@gustavorh/cortala-cli` (en `packages/cli/`) acorta y administra enlaces
desde la terminal usando la misma API REST documentada en `/docs`.

```bash
npm install -g @gustavorh/cortala-cli
cortala login                                  # guarda tu API key en ~/.config/cortala/
cortala shorten https://ejemplo.com -a promo   # crea con alias
cortala list --tag marketing --json | jq       # lista en JSON
cortala stats promo                            # analítica
```

Detalle completo en [`packages/cli/README.md`](./packages/cli/README.md).

## 🌐 Extensión de navegador

Extensión MV3 para Chrome y Firefox en `extensions/browser/`. Acorta el
tab activo con un click, copia la URL corta al portapapeles
automáticamente y configura tu API key en una options page dedicada.

```bash
pnpm --filter @cortala/extension dev          # Chrome con hot reload
pnpm --filter @cortala/extension build        # produce .output/chrome-mv3
pnpm --filter @cortala/extension build:firefox # produce .output/firefox-mv2
```

Detalle completo en [`extensions/browser/README.md`](./extensions/browser/README.md).

## 📊 Observabilidad

- `GET /api/health` — estado del servicio (BD y caché); `503` si la BD cae.
- `GET /api/metrics` — métricas Prometheus (enlaces, redirecciones, clics).

## ⚙️ Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `DB_HOST` `DB_NAME` `DB_USER` `DB_PASSWORD` | ✅ | Conexión MySQL |
| `AUTH_SECRET` | ✅ | Firma de sesiones JWT |
| `NEXT_PUBLIC_BASE_URL` | ✅ | URL pública de la app |
| `DB_NAME_TEST` | tests | BD aislada para integración |
| `REDIS_URL` | — | Activa caché y rate limiting distribuido |
| `SAFE_BROWSING_API_KEY` | — | Escaneo de URLs maliciosas |

## 🧪 Tests

Vitest en dos niveles. Los unitarios no necesitan infraestructura; los de
integración requieren MySQL y se activan con `INTEGRATION_DB=1` (la BD la
define `DB_NAME_TEST`). GitHub Actions ejecuta lint, typecheck, build, los
unitarios y los de integración con un servicio MySQL.

## 📁 Estructura del proyecto

Monorepo pnpm con un par de apps y paquetes compartidos:

```
apps/
  web/             Aplicación Next.js (UI, API, worker BullMQ)
    app/           Páginas y route handlers (App Router)
    lib/           Lógica de negocio (slug, analítica, caché…)
    models/        Modelos Sequelize
    migrations/    Migraciones de esquema
    tests/         Suites unitarias y de integración
packages/
  schemas/         Schemas Zod compartidos del API público (importados por
                   la web app, la CLI y la extensión de navegador)
extensions/        (reservado: extensión Chrome/Firefox MV3)
```

## 🗺️ Roadmap

El proyecto se construyó en cuatro fases, todas completadas:

1. **Identidad y métricas** — cuentas, analítica por enlace, alias, QR, tests.
2. **Plataforma** — API pública, caché Redis, geo-IP, importación masiva, UTM.
3. **Producto** — destinos inteligentes, rotación A/B, QR de marca, link-in-bio.
4. **Operación** — observabilidad, rate limiting distribuido, GDPR, antimalware.

## 📄 Licencia

[MIT](./LICENSE) © Gustavo Reyes

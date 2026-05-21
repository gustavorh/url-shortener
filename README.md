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
| Caché / colas | Redis (`ioredis`) — opcional |
| Observabilidad | `prom-client` (métricas Prometheus) |
| Gráficos | Recharts |
| Tests | Vitest (unitarios + integración) · GitHub Actions |

## 🚀 Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
openssl rand -base64 32      # pega el valor en AUTH_SECRET

# 3. Base de datos (crea la BD en MySQL y aplica las migraciones)
npm run db:migrate

# 4. Desarrollo
npm run dev                  # http://localhost:3000
```

## 📜 Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` / `start` | Build y arranque en producción |
| `npm run lint` / `typecheck` | Linting y chequeo de tipos |
| `npm run test` | Tests en modo watch |
| `npm run test:unit` / `test:integration` | Unitarios / integración |
| `npm run db:migrate` / `db:migrate:undo` | Aplicar / revertir migraciones |

## 🔌 API pública REST

Genera una clave en **Mi panel → Claves de API** y autentícate con
`Authorization: Bearer <clave>`.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `POST` | `/api/v1/links` | Crea un enlace |
| `GET` | `/api/v1/links` | Lista tus enlaces (`?limit=&offset=`) |
| `GET` | `/api/v1/links/:id` | Detalle de un enlace |
| `GET` | `/api/v1/links/:id/stats` | Analítica de un enlace |

```bash
curl -X POST https://tu-dominio/api/v1/links \
  -H "Authorization: Bearer crtl_..." \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com"}'
```

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

```
app/            Páginas y route handlers (App Router)
  [id]/         Redirección + tracking de clics
  api/          Endpoints REST (auth, v1, keys, health, metrics…)
  dashboard/    Panel: enlaces, claves API, importación, perfil
  stats/[id]/   Analítica por enlace
  u/[username]/ Páginas link-in-bio públicas
lib/            Lógica de negocio (slug, analítica, caché, validación…)
models/         Modelos Sequelize
migrations/     Migraciones de esquema
tests/          Suites unitarias y de integración
```

## 🗺️ Roadmap

El proyecto se construyó en cuatro fases, todas completadas:

1. **Identidad y métricas** — cuentas, analítica por enlace, alias, QR, tests.
2. **Plataforma** — API pública, caché Redis, geo-IP, importación masiva, UTM.
3. **Producto** — destinos inteligentes, rotación A/B, QR de marca, link-in-bio.
4. **Operación** — observabilidad, rate limiting distribuido, GDPR, antimalware.

## 📄 Licencia

[MIT](./LICENSE) © Gustavo Reyes

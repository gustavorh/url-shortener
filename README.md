# Cortala — URL Shortener

Acortador de URLs full-stack construido con **Next.js 15 (App Router)**, **React 19**,
**TypeScript**, **Sequelize** y **MySQL**. Incluye cuentas de usuario, analítica por
enlace, alias personalizados, códigos QR y una base de ingeniería con migraciones,
tests y CI.

## Stack

- **Frontend / Backend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Datos:** MySQL + Sequelize 6 (migraciones con `sequelize-cli`)
- **Auth:** Auth.js (next-auth v5), sesiones JWT, contraseñas con `bcryptjs`
- **Tests:** Vitest (unitarios + integración) · CI con GitHub Actions

## Getting Started

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia las variables de entorno y ajústalas:

   ```bash
   cp .env.example .env
   # genera un secreto para Auth.js:
   openssl rand -base64 32   # pega el valor en AUTH_SECRET
   ```

3. Crea la base de datos en MySQL (la que indicaste en `DB_NAME`) y aplica las
   migraciones:

   ```bash
   npm run db:migrate
   ```

4. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` / `npm start` | Build y arranque en producción |
| `npm run lint` / `npm run typecheck` | Linting y chequeo de tipos |
| `npm run test` | Tests en modo watch |
| `npm run test:run` | Toda la suite una vez |
| `npm run test:unit` / `npm run test:integration` | Solo unitarios / solo integración |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:migrate:undo` | Revierte la última migración |

## Base de datos

El esquema lo gobiernan las migraciones de `migrations/` (no se usa
`model.sync()`). Para los tests de integración se utiliza una base de datos
separada definida en `DB_NAME_TEST`.

## API pública REST

Genera una clave en **Mi panel → Claves de API** y autentícate con la
cabecera `Authorization: Bearer <clave>`.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `POST` | `/api/v1/links` | Crea un enlace. Body: `{ "url", "customAlias?", "expirationDate?" }` |
| `GET` | `/api/v1/links` | Lista tus enlaces. Query: `?limit=&offset=` |
| `GET` | `/api/v1/links/:id` | Detalle de un enlace |
| `GET` | `/api/v1/links/:id/stats` | Analítica de un enlace |

```bash
curl -X POST https://tu-dominio/api/v1/links \
  -H "Authorization: Bearer crtl_..." \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com"}'
```

## Despliegue

Hay un `Dockerfile` multi-stage. Las migraciones se ejecutan manualmente
(`npm run db:migrate`) contra la base de datos destino antes de levantar la app.

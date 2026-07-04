# Diseño: CI/CD de Linkly → prod-host (homelab)

Fecha: 2026-07-04
Estado: aprobado, en ejecución

## Objetivo

Desplegar Linkly (`@linkly/web`) en la VM `prod-host` (10.0.30.254) del homelab
mediante un runner self-hosted de GitHub Actions, replicando el patrón ya
probado en el proyecto MiPlata.

## Contexto de infraestructura (prod-host)

- **Gateway**: Caddy (`caddy:2-alpine`) escuchando en `10.0.30.254:8080`,
  config en `~/services/caddy/Caddyfile` (montado read-only), unido a la red
  externa `edge`. Enruta por header `Host` a alias de contenedores en `edge`.
- **Runner existente**: `~/actions-runner` (v2.335.1) registrado **solo** a
  `gustavorh/MiPlata`, como servicio systemd. Los runners son por-repo.
- **Redes docker**: `edge` (externa) usada por Caddy + MiPlata.
- **MySQL**: servidor externo `10.0.30.5:3306` (alcanzable desde prod-host).
- No hay MySQL ni Redis corriendo en prod-host.
- `sudo` requiere contraseña. Sin cliente `mysql` en el host (se usa `mysql:8`
  vía docker).

## Diferencias Linkly vs MiPlata

| | MiPlata | Linkly |
|---|---|---|
| Apps | backend (NestJS) + frontend (Next) | 1 app Next.js fullstack `@linkly/web` |
| DB | Postgres externo | MySQL externo (10.0.30.5) |
| Cola | — | Redis + BullMQ (3 workers) |
| Migraciones | TypeORM `synchronize` | `sequelize-cli db:migrate` (paso explícito) |

## Decisiones

1. **MySQL externo** en 10.0.30.5. Se crea base `linkly_prod` y usuario `linkly`
   dedicado (privilegios solo sobre `linkly_prod`).
2. **Redis + 3 workers** en el stack: `worker` (clicks), `webhook-worker`,
   `notifications-worker`.
3. **Host interno** `linkly.home.gustavorh.com` vía Caddy (como MiPlata).
4. Un **segundo runner** self-hosted en prod-host, registrado a
   `gustavorh/url-shortener`, labels `self-hosted,prod-host`.

## Arquitectura del stack (`docker-compose.yml`)

- `web`: `pnpm start` (Next.js :3000). Único servicio en `edge`, alias
  `linkly-web`. Caddy → `reverse_proxy linkly-web:3000`.
- `worker` / `webhook-worker` / `notifications-worker`: mismos binarios, distinto
  CMD (`tsx scripts/start-*.ts`), red interna.
- `redis`: `redis:7-alpine` con volumen `redis-data`, red interna.
- `migrate`: one-shot `pnpm db:migrate`; el resto depende de
  `service_completed_successfully`.
- MySQL no es un servicio: se apunta al externo vía `.env`.

Una sola imagen `linkly-web:latest` sirve los cinco roles.

## Imagen Docker (`apps/web/Dockerfile`)

Reescrita al patrón pnpm + monorepo (el anterior usaba `npm ci` y no era
workspace-aware). Mantiene la estructura del workspace intacta para que los
alias de tsconfig (`@/*`, `@linkly/schemas`) resuelvan igual que en dev.
`NEXT_PUBLIC_BASE_URL` se hornea como build-arg; `AUTH_SECRET` es placeholder de
build (el real llega en runtime).

`tsx`, `sequelize-cli` y `dotenv` se movieron de `devDependencies` a
`dependencies` porque se ejecutan en runtime (workers y migraciones).

## Workflow (`.github/workflows/deploy.yml`)

Gemelo del de MiPlata: en push a `main` → checkout → `rsync` a
`~/services/linkly/` (excluye `.git` y `.env`) → `docker compose build && up -d`
→ smoke test `GET /api/health` vía Caddy (header `Host`) → `docker image prune`.
El `.env` vive en el servidor y nunca se commitea. `ci.yml` se mantiene intacto.

## Provisioning en prod-host (una vez)

1. Crear `linkly_prod` + usuario `linkly` en MySQL 10.0.30.5.
2. Registrar el 2º runner (token vía `gh api`), instalarlo como servicio systemd.
3. Crear `~/services/linkly/.env` con los secretos reales.
4. Añadir bloque a `Caddyfile` para `linkly.home.gustavorh.com` + reload.
5. Merge a `main` → primer deploy → verificar health.

## Secretos

Password de MySQL de `linkly` y `AUTH_SECRET` se generan con `openssl rand` y
viven solo en `~/services/linkly/.env` (permisos 600). No se commitean.

# Arquitectura

Documento de diseño de **Linkly**. Para una visión general y la guía de
puesta en marcha, ver el [README](./README.md).

## Visión general

Linkly es una aplicación **monolítica de Next.js 15** (App Router): el
frontend (React Server/Client Components) y la API (route handlers) viven en
el mismo proceso y despliegue. La persistencia es **MySQL** vía **Sequelize**;
**Redis** es una dependencia opcional para caché y rate limiting.

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js (App Router)                     │
│                                                               │
│  Server Components        Route Handlers (/app/api, /[id])    │
│  (dashboard, stats…)      (REST, redirección, auth)           │
└───────────┬───────────────────────┬──────────────────────────┘
            │                       │
   middleware.ts (Auth.js)          │
            │                       │
            ▼                       ▼
   rutas protegidas        lib/  ── lógica de negocio
   (/dashboard, /stats)      │
                             ├── Sequelize ───▶ MySQL
                             ├── ioredis ─────▶ Redis (opcional)
                             └── fetch ───────▶ Safe Browsing (opcional)
```

### Capas

| Capa | Responsabilidad | Ubicación |
| --- | --- | --- |
| Presentación | Páginas SSR y componentes cliente | `app/**` |
| API | Route handlers REST | `app/api/**`, `app/[id]` |
| Dominio | Lógica de negocio reutilizable | `lib/**` |
| Datos | Modelos y esquema | `models/**`, `migrations/**` |

La regla clave: los route handlers son delgados; la lógica vive en `lib/` y
es testeable de forma aislada (p. ej. `link-service`, `redirect-resolver`,
`slug`, `url-validation`).

## Modelo de datos

```
users ──┬──< urls ──┬──< clicks
        │           └──< link_targets
        └──< api_keys

users        cuentas (email, hash de contraseña, perfil público)
urls         enlaces (código corto = PK, destino, expiración, soft-delete)
clicks       evento por visita (IP anonimizada, UA, geo, destino servido)
link_targets destinos alternativos (por dispositivo o variante A/B)
api_keys     claves de la API pública (solo hash SHA-256)
```

El esquema lo gobiernan exclusivamente las **migraciones** de `migrations/`
(`sequelize-cli`); nunca se usa `model.sync()` en producción. Las claves
foráneas usan `ON DELETE CASCADE`, de modo que borrar un usuario elimina sus
enlaces, clics, destinos y claves.

## Flujos principales

### Crear un enlace (`POST /api/shorten-url`)

```
1. Rate limit por IP            → 429 si se excede
2. Validación + normalización   → allowlist http/https
3. Guard SSRF                   → rechaza IPs privadas/loopback/metadata
4. Safe Browsing (si hay key)   → rechaza malware/phishing
5. Resolver código corto        → alias personalizado o slug Base62 único
6. Persistir en `urls`          → asociado al usuario si hay sesión
```

La lógica de los pasos 2-6 vive en `lib/link-service.ts` y la comparten el
endpoint individual y el de importación masiva.

### Redirección (`GET /[id]`)

```
1. resolveLink(id)              → caché Redis (cache-aside) o MySQL
2. Comprobar expiración / soft-delete
3. chooseDestination()          → device override > rotación A/B > base
4. recordClick()                → IP anonimizada + geo + UA (fire-and-forget)
5. 302 → destino
```

`resolveLink` cachea el enlace y sus destinos en Redis cuando está
configurado; la caché se invalida al modificar el enlace o sus destinos.

## Decisiones de diseño

- **Redis es opcional.** Sin `REDIS_URL`, la caché es un no-op y el rate
  limiter usa memoria. Una caída de Redis degrada con elegancia en lugar de
  tumbar la app.
- **Fail-open en dependencias externas.** Errores de Safe Browsing o del
  rate limiter distribuido nunca bloquean la creación de enlaces.
- **El esquema es de las migraciones, no del código.** Garantiza entornos
  reproducibles; `sync()` solo se usa para montar la BD de tests.
- **Privacy by design.** Las IP se anonimizan antes de persistir; el borrado
  de cuenta es real (cascada) y existe export de datos.
- **Seguridad de la redirección.** Allowlist de protocolos y guard SSRF en la
  creación. Limitación conocida: no se cubre DNS rebinding (el servidor no
  hace fetch del destino, así que el riesgo es acotado).

## Observabilidad

- `GET /api/health` — sondas de BD y caché; responde `503` si la BD cae.
- `GET /api/metrics` — exposición Prometheus: contadores de enlaces creados,
  redirecciones (etiquetadas por resultado), clics, y métricas de proceso.

## Tests

- **Unitarios** (`tests/unit`) — lógica pura sin infraestructura: generación
  de slugs, validación de URL/SSRF, resolución de destinos, etc.
- **Integración** (`tests/integration`) — contra MySQL real; verifican
  persistencia, agregaciones de analítica, soft-delete y autenticación por
  API key. Se ejecutan en serie sobre una BD aislada.

CI (GitHub Actions) corre lint, typecheck, build y ambas suites.

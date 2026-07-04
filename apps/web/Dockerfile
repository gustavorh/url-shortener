# syntax=docker/dockerfile:1
#
# Imagen única de Linkly (@linkly/web) para producción. Sirve para los cuatro
# roles del stack cambiando el CMD desde docker-compose:
#   - web                  -> pnpm start            (Next.js, :3000)
#   - worker               -> pnpm worker           (BullMQ, clicks)
#   - webhook-worker       -> pnpm webhook-worker
#   - notifications-worker -> pnpm notifications:worker
#   - migrate (one-shot)   -> pnpm db:migrate        (sequelize-cli)
#
# Monorepo pnpm: mantenemos la estructura del workspace intacta para que los
# alias de tsconfig (@/*, @linkly/schemas) resuelvan igual que en desarrollo.

FROM node:20-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

WORKDIR /app

# Instala el workspace de @linkly/web y sus dependencias (incluye dev deps,
# necesarias para compilar Next).
COPY . .
RUN pnpm install --frozen-lockfile --filter @linkly/web...

# NEXT_PUBLIC_* se hornea en el bundle del cliente en tiempo de build, así que
# la URL pública debe estar disponible aquí. AUTH_SECRET solo es un placeholder
# de build; el valor real llega en runtime vía env_file.
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV AUTH_SECRET=build-time-placeholder-not-used-at-runtime
RUN pnpm --filter @linkly/web build

ENV NODE_ENV=production
WORKDIR /app/apps/web

EXPOSE 3000

# CMD por defecto = servidor web. docker-compose lo sobreescribe para workers
# y para el job de migraciones.
CMD ["pnpm", "start"]

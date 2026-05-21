# Guía de contribución

Gracias por tu interés en mejorar **Cortala**.

## Puesta en marcha

Sigue la sección [_Puesta en marcha_ del README](./README.md#-puesta-en-marcha)
para instalar dependencias, configurar `.env` y aplicar migraciones.

## Flujo de trabajo

1. Crea una rama desde `main`:
   - `feature/<nombre>` para funcionalidades
   - `fix/<nombre>` para correcciones
   - `chore/<nombre>` / `docs/<nombre>` para mantenimiento
2. Realiza cambios pequeños y enfocados, con commits descriptivos.
3. Antes de abrir un Pull Request, asegúrate de que pasa todo:

   ```bash
   npm run lint
   npm run typecheck
   npm run test:run
   npm run build
   ```

4. Abre el PR contra `main` describiendo el qué y el porqué.

## Convenciones

- **Mensajes de commit**: estilo [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `test:`…).
- **Código**: TypeScript en modo estricto. La lógica de negocio va en `lib/`
  (testeable de forma aislada); los route handlers se mantienen delgados.
- **Esquema**: todo cambio de base de datos se hace con una migración nueva
  en `migrations/` — nunca con `model.sync()`.
- **Tests**: acompaña la lógica nueva con tests unitarios; añade tests de
  integración cuando toques persistencia.

## Cambios de esquema

```bash
npx sequelize-cli migration:generate --name describe-tu-cambio
npm run db:migrate
```

Mantén `lib/reserved-slugs.ts` sincronizado si añades rutas de primer nivel.

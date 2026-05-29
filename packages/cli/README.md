# @gustavorh/linkly-cli

Acorta y administra enlaces de [Linkly](https://github.com/gustavorh/url-shortener) desde la terminal.

## Instalación

```bash
# Global (recomendado)
npm install -g @gustavorh/linkly-cli

# O puntual con npx
npx @gustavorh/linkly-cli shorten https://ejemplo.com
```

Requiere Node.js 20+.

## Empezar

```bash
linkly login
# URL base [http://localhost:3000]: https://tu-dominio.com
# API key (crtl_…): ********
# ✓ Sesión iniciada como tu@email.com
#   Config guardada en /Users/you/.config/linkly/config.json (modo 0600)
```

La API key se genera desde tu panel en **Mi panel → Claves de API**. Se
guarda en `~/.config/linkly/config.json` (respeta `$XDG_CONFIG_HOME`) con
permisos `0600`, así que otros usuarios del sistema no pueden leerla.

## Comandos

```bash
linkly shorten <url> [-a alias] [-e iso-date] [-m maxClicks] [-p pwd]
linkly list    [--limit 50] [--offset 0] [--search ...] [--tag ...] [--json]
linkly stats   <id> [--json]
linkly whoami
linkly login   [--api-key ...] [--base-url ...]
linkly logout
```

### Ejemplos

```bash
# Acortar con alias personalizado
linkly shorten https://ejemplo.com -a promo

# Acortar y copiar al portapapeles (macOS)
linkly shorten https://ejemplo.com --quiet | pbcopy

# Listar enlaces filtrando por etiqueta, en JSON
linkly list --tag marketing --json | jq

# Estadísticas de un enlace
linkly stats promo
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `LINKLY_URL` | URL base que se usa si no hay config y no se pasa `--base-url` |
| `LINKLY_API_KEY` | API key que evita el prompt interactivo en `linkly login` |
| `LINKLY_CONFIG_PATH` | Sobrescribe la ruta del archivo de config (útil para testing) |
| `XDG_CONFIG_HOME` | Estándar XDG: cambia el directorio padre del config |

## Salida

Los comandos imprimen una versión legible por humanos por defecto. Para
scripting:

- `linkly shorten ... --quiet` → solo la URL corta.
- `linkly list --json` / `linkly stats <id> --json` → el JSON crudo
  que devuelve la API REST.

Códigos de salida: `0` éxito, `1` cualquier error (mensaje en stderr).

## Licencia

[MIT](../../LICENSE) © Gustavo Reyes

# Linkly — extensión de navegador

Extensión MV3 para **Chrome** y **Firefox** que acorta enlaces con tu
instancia de Linkly desde la barra del navegador. Misma API REST que
la web app y la CLI: usa la API key que generes en *Mi panel → Claves
de API* y los schemas Zod compartidos en
[`packages/schemas`](../../packages/schemas/) validan cada respuesta.

## Cargar localmente (desarrollo)

```bash
pnpm --filter @linkly/extension dev          # Chrome con hot reload
pnpm --filter @linkly/extension dev:firefox  # Firefox con hot reload
```

WXT abre un navegador con la extensión cargada en modo desarrollador.
Alternativa manual:

```bash
pnpm --filter @linkly/extension build        # Chrome (.output/chrome-mv3)
pnpm --filter @linkly/extension build:firefox # Firefox (.output/firefox-mv2)
```

Luego, en Chrome: `chrome://extensions` → activa *Developer mode* →
*Load unpacked* → selecciona `.output/chrome-mv3/`.
En Firefox: `about:debugging#/runtime/this-firefox` → *Load Temporary
Add-on…* → selecciona `.output/firefox-mv2/manifest.json`.

## Configurar

1. Click derecho en el icono de la extensión → *Options* (o en
   `chrome://extensions` → *Detalles* → *Opciones de extensión*).
2. Pega la URL de tu instancia (`http://localhost:3000` por defecto) y
   tu API key.
3. Click en **Guardar y verificar** — la extensión llama a `/api/v1/me`
   para confirmar antes de guardar.

## Usar

Click en el icono de la extensión → el popup pre-rellena la URL del
tab activo → opcionalmente un alias → **Acortar** → la URL corta se
copia al portapapeles automáticamente.

Botones extra en el resultado:

- **Copiar** vuelve a copiar al portapapeles.
- **Abrir** abre la URL corta en un nuevo tab.
- **Acortar otra** vuelve al formulario.

## Empaquetar para publicar

```bash
pnpm --filter @linkly/extension zip          # Chrome Web Store
pnpm --filter @linkly/extension zip:firefox  # addons.mozilla.org
```

Genera ZIPs en `.output/`.

## Estructura

```
entrypoints/
  background.ts        service worker; centraliza llamadas al API
  popup/               UI del popup (HTML + TS + CSS plain, sin framework)
  options/             página de opciones (mismo enfoque)
lib/
  client.ts            cliente HTTP tipado, valida con @linkly/schemas/v1
  storage.ts           wrapper sobre browser.storage.local (wxt/utils/storage)
  messages.ts          tipos discriminated-union para mensajes background↔popup
wxt.config.ts          config del manifest cross-browser
```

## Permisos solicitados

| Permiso | Por qué lo pedimos |
| --- | --- |
| `storage` | Guardar `baseUrl` + `apiKey` localmente |
| `activeTab` | Leer la URL del tab actual al abrir el popup |
| `clipboardWrite` | Copiar la URL corta automáticamente |
| `host_permissions: <all_urls>` | Necesario para llamar a tu instancia self-hospedada (cualquiera que sea su dominio). El código solo llama al `baseUrl` configurado. |

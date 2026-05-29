import { defineConfig } from "wxt";

// WXT config for the Linkly browser extension. Builds the same source
// for Chrome (manifest_version: 3) and Firefox; WXT handles the manifest
// quirks automatically when invoked with `--browser firefox`.

export default defineConfig({
  manifest: {
    name: "Linkly",
    description:
      "Acorta enlaces con Linkly desde la barra del navegador. Configura tu API key en las opciones.",
    permissions: ["storage", "activeTab", "clipboardWrite"],
    // host_permissions stays open so users can point the extension at
    // whatever Linkly instance they run (self-hosted or otherwise). The
    // background script enforces a single configured base URL at request
    // time, so this isn't as permissive in practice as it looks.
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Linkly — acortar el tab actual",
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true,
    },
    browser_specific_settings: {
      gecko: {
        id: "linkly@gustavorh.dev",
      },
    },
  },
});

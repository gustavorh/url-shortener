// swagger-ui-dist ships .js + .css without bundled types. Declare just
// what the /docs page needs — the full surface is documented at
// https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/

declare module "swagger-ui-dist/swagger-ui-bundle.js" {
  const SwaggerUIBundle: (config: Record<string, unknown>) => unknown;
  export default SwaggerUIBundle;
}

declare module "swagger-ui-dist/swagger-ui.css";

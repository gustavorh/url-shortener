// Public entry point for @linkly/schemas. Re-exports every versioned
// schema namespace so consumers can `import { foo } from "@linkly/schemas"`
// or pick a single version via the subpath export (`@linkly/schemas/v1`).

export * from "./v1";
export * from "./webhooks";

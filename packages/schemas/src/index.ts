// Public entry point for @cortala/schemas. Re-exports every versioned
// schema namespace so consumers can `import { foo } from "@cortala/schemas"`
// or pick a single version via the subpath export (`@cortala/schemas/v1`).

export * from "./v1";

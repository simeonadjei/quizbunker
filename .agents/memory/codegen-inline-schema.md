---
name: Codegen inline schema collision
description: Orval generates duplicate exported type names when OpenAPI request bodies use inline schemas instead of $ref
---

When an OpenAPI endpoint uses an inline `type: object` for its requestBody schema, Orval generates the type name in BOTH `lib/api-zod/src/generated/api.ts` AND `lib/api-zod/src/generated/types/<name>.ts`. The `lib/api-zod/src/index.ts` barrel (`export * from "./generated/api"` + `export * from "./generated/types"`) then has two conflicting exports, causing a TS2308 error.

**Why:** Orval creates both a zod schema in `api.ts` and a TypeScript type file for inline schemas. Named component refs (`$ref: "#/components/schemas/Foo"`) don't hit this because the schema already exists in the types folder separately.

**How to apply:** Always add request body schemas to `components/schemas` in `lib/api-spec/openapi.yaml` and reference them with `$ref`. Never use inline `type: object` for request bodies.

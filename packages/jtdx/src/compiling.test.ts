import { describe, expect, it } from "vitest";

import { jsonTypeOf } from "./utils/jsonTypeOf";

import { compile } from "./compiling";

import officialInvalidSchemasJson from "../../../third-party/json-typedef-spec/tests/invalid_schemas.json" assert {
  type: "json",
};

describe("Official", () => {
  for (const [name, schema] of Object.entries(officialInvalidSchemasJson)) {
    const caseName = `${name}: ${JSON.stringify(schema)}`;

    if (jsonTypeOf(schema) === "object" && "definitions" in (schema as any)) {
      it.todo(caseName);
      continue;
    }
    it(caseName, () => {
      const compileResult = compile(schema as any);
      expect(compileResult.isOk).toBe(false);
    });
  }
});

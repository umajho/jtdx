import { describe, expect, it } from "vitest";

import { expectCompilationErrors } from "../../test-support/utils";

import { Schema } from "../types";
import { CompilationOptions, compile } from "../mod";

import { BreakingExtensions } from "./mod";

const COMPILATION_OPTIONS: CompilationOptions = {
  breakingExtensions: [BreakingExtensions.disallowEmptyMappings],
};

const ERROR_PREFIX = "EXTENSION:DISALLOW_EMPTY_MAPPINGS" as const;

describe("Compilation", () => {
  describe("Errors", () => {
    it("works", () => {
      const schema: Schema = { discriminator: "foo", mapping: {} };

      expect(compile(schema).isOk).toBe(true);

      expectCompilationErrors(
        schema,
        [{
          schemaPath: ["discriminator"],
          raw: { type: `${ERROR_PREFIX}:DISCRIMINATOR_FORM:EMPTY_MAPPING` },
        }],
        { compilationOptions: COMPILATION_OPTIONS },
      );
    });
  });
});

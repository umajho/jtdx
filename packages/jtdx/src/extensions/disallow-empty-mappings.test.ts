import { describe, expect, it } from "vitest";

import { expectError } from "../../test-support/utils";

import { Schema } from "../types";
import { CompilationOptions, compile } from "../mod";

const COMPILATION_OPTIONS: CompilationOptions = {
  extensions: {
    breaking: {
      "(disallow empty mappings)": true,
    },
  },
};

const ERROR_PREFIX = "EXTENSION:DISALLOW_EMPTY_MAPPINGS" as const;

describe("Compilation", () => {
  describe("Errors", () => {
    it("works", () => {
      const schema: Schema = { discriminator: "foo", mapping: {} };

      expect(compile(schema, { extensions: null }).isOk).toBe(true);

      expectError(
        schema,
        [{
          schemaPath: [],
          raw: { type: `${ERROR_PREFIX}:DISCRIMINATOR_FORM:EMPTY_MAPPING` },
        }],
        { compilationOptions: COMPILATION_OPTIONS },
      );
    });
  });
});

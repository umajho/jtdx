import { describe, it } from "vitest";

import "../../test-support/init";

import { Schema } from "../types";
import { BreakingExtensions, CompilationOptions } from "../mod";
import {
  expectValidationErrors,
  expectValidationOk,
} from "../../test-support/utils";

const COMPILATION_OPTIONS: CompilationOptions = {
  breakingExtensions: [BreakingExtensions.disallowLeapSeconds],
};

const ERROR_PREFIX = "EXTENSION:DISALLOW_LEAP_SECONDS" as const;

describe("Validation", () => {
  it("works", () => {
    const schema: Schema = { type: "timestamp" };
    const data = "1990-12-31T23:59:60Z";

    expectValidationOk(schema, data);

    expectValidationErrors(schema, data, [{
      schemaPath: ["type"],
      instancePath: [],
      raw: {
        type: `${ERROR_PREFIX}:TYPE_FORM:LEAP_SECONDS_NOT_ALLOWED_ON_TIMESTAMP`,
      },
    }], { compilationOptions: COMPILATION_OPTIONS });
  });
});

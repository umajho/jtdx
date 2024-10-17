import { describe, expect } from "vitest";

import { testExamplesByFeatureForValidation } from "../../../test-support/test-examples";

import { compile } from "../../mod";

import examplesByFeature from "./mod.examples";
import { CompilationResult } from "../../../dist/types/mod";
import { BreakingExtensions } from "../mod";

describe("Compilation", () => {
  describe.todo("Errors");
});

describe("Validation", () => {
  describe("Examples", () => {
    testExamplesByFeatureForValidation(examplesByFeature, {
      createValidator: (schema) => {
        const compileResult = compile(schema, {
          breakingExtensions: [BreakingExtensions.xChecks],
        });
        expect(compileResult).compilationToBeOk();
        return (compileResult as Extract<CompilationResult, { isOk: true }>)
          .validator;
      },
    });
  });
});

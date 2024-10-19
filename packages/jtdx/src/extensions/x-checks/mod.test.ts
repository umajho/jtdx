import { describe, expect, it } from "vitest";

import { testExamplesByFeatureForValidation } from "../../../test-support/test-examples";

import { compile, ValidationError } from "../../mod";
import { CompilationResult } from "../../../dist/types/mod";
import { BreakingExtensions } from "../mod";
import { Schema } from "../../types";
import { expectValidationErrors as expectValidationErrorsBase } from "../../../test-support/utils";

import examplesByFeature from "./mod.examples";

describe("Compilation", () => {
  describe.todo("When not being used");

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

  describe("Errors", () => {
    describe("PATTERN_MISMATCH", () => {
      it("case 1", () => {
        expectValidationErrors(
          { type: "string", "x:checks": { pattern: "foo" } },
          "bar",
          [{
            schemaPath: ["type"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:PATTERN_MISMATCH",
              pattern: "foo",
            },
          }],
        );
      });
    });
    describe("NOT_MULTIPLE_OF", () => {
      it("case 1", () => {
        expectValidationErrors(
          { type: "int32", "x:checks": { multipleOf: 2 } },
          3,
          [{
            schemaPath: ["type"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:NOT_MULTIPLE_OF",
              multipleOf: 2,
            },
          }],
        );
      });
    });
    describe("ELEMENTS_NOT_UNIQUE", () => {
      it("case 1", () => {
        expectValidationErrors(
          { elements: { type: "int8" }, "x:checks": { uniqueElements: true } },
          [42, 42],
          [{
            schemaPath: ["elements"],
            instancePath: [],
            raw: { type: "EXTENSION:X_CHECKS:ELEMENTS_NOT_UNIQUE" },
          }],
        );
      });
      it("case 2", () => {
        expectValidationErrors(
          { elements: { enum: ["foo"] }, "x:checks": { uniqueElements: true } },
          ["foo", "foo"],
          [{
            schemaPath: ["elements"],
            instancePath: [],
            raw: { type: "EXTENSION:X_CHECKS:ELEMENTS_NOT_UNIQUE" },
          }],
        );
      });
    });
    describe("OUT_OF_BOUND", () => {
      it("case 1", () => {
        expectValidationErrors(
          { type: "string", "x:checks": { minLength: 5 } },
          "1234",
          [{
            schemaPath: ["type"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:OUT_OF_BOUND",
              comparisonTargetType: "string_length",
              bound: 5,
              targetBeingWhatThanBound: "<",
            },
          }],
        );
      });
      it("case 2", () => {
        expectValidationErrors(
          { type: "int8", "x:checks": { exclusiveMaximum: 5 } },
          5,
          [{
            schemaPath: ["type"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:OUT_OF_BOUND",
              comparisonTargetType: "value",
              bound: 5,
              targetBeingWhatThanBound: ">=",
            },
          }],
        );
      });
      it("case 3", () => {
        expectValidationErrors(
          { elements: {}, "x:checks": { minElements: 3 } },
          [],
          [{
            schemaPath: ["elements"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:OUT_OF_BOUND",
              comparisonTargetType: "elements",
              bound: 3,
              targetBeingWhatThanBound: "<",
            },
          }],
        );
      });
      it("case 4", () => {
        expectValidationErrors(
          {
            properties: { foo: {} },
            additionalProperties: true,
            "x:checks": { maxProperties: 2 },
          },
          { foo: 1, bar: 2, baz: 3 },
          [{
            schemaPath: ["properties"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:OUT_OF_BOUND",
              comparisonTargetType: "properties",
              bound: 2,
              targetBeingWhatThanBound: ">",
            },
          }],
        );
      });
      it("case 5", () => {
        expectValidationErrors(
          {
            optionalProperties: { foo: {}, bar: {} },
            "x:checks": { maxProperties: 1 },
          },
          { foo: 1, bar: 2 },
          [{
            schemaPath: ["optionalProperties"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:OUT_OF_BOUND",
              comparisonTargetType: "properties",
              bound: 1,
              targetBeingWhatThanBound: ">",
            },
          }],
        );
      });
      it("case 6", () => {
        expectValidationErrors(
          {
            values: {},
            "x:checks": { minValues: 1 },
          },
          {},
          [{
            schemaPath: ["values"],
            instancePath: [],
            raw: {
              type: "EXTENSION:X_CHECKS:OUT_OF_BOUND",
              comparisonTargetType: "values",
              bound: 1,
              targetBeingWhatThanBound: "<",
            },
          }],
        );
      });
    });
  });
});

function expectValidationErrors(
  schema: Schema,
  data: any,
  errors: ValidationError[],
) {
  expectValidationErrorsBase(schema, data, errors, {
    compilationOptions: {
      breakingExtensions: [BreakingExtensions.xChecks],
    },
  });
}

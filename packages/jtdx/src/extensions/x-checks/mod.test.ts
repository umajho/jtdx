import { describe, expect, it } from "vitest";

import { testExamplesByFeatureForValidation } from "../../../test-support/test-examples";

import { compile, ValidationError } from "../../mod";
import { CompilationResult } from "../../../dist/types/mod";
import { BreakingExtensions } from "../mod";
import { Schema } from "../../types";

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
        expectValidationError(
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
        expectValidationError(
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
    describe("ITEMS_NOT_UNIQUE", () => {
      it("case 1", () => {
        expectValidationError(
          { elements: { type: "int8" }, "x:checks": { uniqueItems: true } },
          [42, 42],
          [{
            schemaPath: ["elements"],
            instancePath: [],
            raw: { type: "EXTENSION:X_CHECKS:ITEMS_NOT_UNIQUE" },
          }],
        );
      });
      it("case 2", () => {
        expectValidationError(
          { elements: { enum: ["foo"] }, "x:checks": { uniqueItems: true } },
          ["foo", "foo"],
          [{
            schemaPath: ["elements"],
            instancePath: [],
            raw: { type: "EXTENSION:X_CHECKS:ITEMS_NOT_UNIQUE" },
          }],
        );
      });
    });
    describe("OUT_OF_BOUND", () => {
      it("case 1", () => {
        expectValidationError(
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
        expectValidationError(
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
        expectValidationError(
          { elements: {}, "x:checks": { minItems: 3 } },
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
        expectValidationError(
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
        expectValidationError(
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
        expectValidationError(
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

function expectValidationError(
  schema: Schema,
  data: any,
  errors: ValidationError[],
) {
  const compResult = compile(schema, {
    breakingExtensions: [BreakingExtensions.xChecks],
  });
  expect(compResult).compilationToBeOk();
  const validator =
    (compResult as Extract<CompilationResult, { isOk: true }>).validator;

  expect(validator.validate(data)).toEqual({ isOk: false, errors });
}

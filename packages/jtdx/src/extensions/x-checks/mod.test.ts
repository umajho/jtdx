import { describe, expect, it } from "vitest";

import { testExamplesByFeatureForValidation } from "../../../test-support/test-examples";

import { CompilationError, compile, ValidationError } from "../../mod";
import { CompilationResult } from "../../../dist/types/mod";
import { BreakingExtensions } from "../mod";
import { Schema } from "../../types";
import {
  expectCompilationErrors as expectCompilationErrorsBase,
  expectValidationErrors as expectValidationErrorsBase,
} from "../../../test-support/utils";

import examplesByFeature from "./mod.examples";

describe("Compilation", () => {
  describe.todo("When not being used");

  describe("Errors", () => {
    describe("X_OBJECT", () => {
      describe("NOT_OBJECT", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { "x:checks": 42 } as any,
            [{
              schemaPath: [],
              raw: { type: "EXTENSION:X_CHECKS:X_OBJECT:NOT_OBJECT" },
            }],
          );
        });
      });
      describe("SURPLUS_PROPERTIES", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { "x:checks": { foo: 42 } } as any,
            [{
              schemaPath: [],
              raw: {
                type: "EXTENSION:X_CHECKS:X_OBJECT:SURPLUS_PROPERTIES",
                keys: ["foo"],
              },
            }],
          );
        });
      });
    });
    describe("TYPE_FORM", () => {
      describe("LENGTH_ON_NON_STRING", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "int8", "x:checks": { minLength: 3 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:LENGTH_ON_NON_STRING",
                actualType: "int8",
              },
            }],
          );
        });
      });
      describe("PATTERN_ON_NON_STRING", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "int8", "x:checks": { pattern: "^foo$" } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:PATTERN_ON_NON_STRING",
                actualType: "int8",
              },
            }],
          );
        });
      });
      describe("NON_STRING_PATTERN", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "string", "x:checks": { pattern: 42 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:NON_STRING_PATTERN",
                patternType: "number",
              },
            }],
          );
        });
      });
      describe("INVALID_PATTERN", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "string", "x:checks": { pattern: "(" } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:INVALID_PATTERN",
                errorMessage: mustGetNewRegExpErrorMessage("("),
              },
            }],
          );
        });
      });
      describe("BOUND_ON_NON_BOUNDABLE", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "string", "x:checks": { maximum: 3 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:BOUND_ON_NON_BOUNDABLE",
                boundSide: "max",
                actualType: "string",
              },
            }],
          );
        });
      });
      describe("NON_STRING_BOUND_ON_TIMESTAMP", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "timestamp", "x:checks": { maximum: 42 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:TYPE_FORM:NON_STRING_BOUND_ON_TIMESTAMP",
                boundSide: "max",
                actualBoundType: "number",
              },
            }],
          );
        });
      });
      describe("NON_RFC3339_BOUND_ON_TIMESTAMP", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "timestamp", "x:checks": { minimum: "foo" } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:TYPE_FORM:NON_RFC3339_BOUND_ON_TIMESTAMP",
                boundSide: "min",
              },
            }],
          );
        });
      });
      describe("NON_INTEGER_BOUND_ON_INTEGER", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "int32", "x:checks": { minimum: 0.1 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:TYPE_FORM:NON_INTEGER_BOUND_ON_INTEGER",
                boundSide: "min",
              },
            }],
          );
        });
      });
      describe("BOUND_OUT_OF_RANGE", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "uint8", "x:checks": { minimum: 256 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:BOUND_OUT_OF_RANGE",
                boundSide: "min",
                typeType: "uint8",
              },
            }],
          );
        });
      });
      describe("MULTIPLE_OF_ON_NON_NUMERIC", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "string", "x:checks": { multipleOf: 10 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:MULTIPLE_OF_ON_NON_NUMERIC",
              },
            }],
          );
        });
      });
      describe("MULTIPLE_OF_ON_NON_INTEGER_NUMERIC_NOT_SUPPORTED", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "float32", "x:checks": { multipleOf: 10 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:TYPE_FORM:MULTIPLE_OF_ON_NON_INTEGER_NUMERIC_NOT_SUPPORTED",
              },
            }],
          );
        });
      });
      describe("NON_NUMERIC_MULTIPLE_OF", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "int32", "x:checks": { multipleOf: "foo" } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:TYPE_FORM:NON_NUMERIC_MULTIPLE_OF",
              },
            }],
          );
        });
      });
      describe("NON_INTEGER_MULTIPLE_OF_NOT_SUPPORTED", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "int32", "x:checks": { multipleOf: 0.1 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:TYPE_FORM:NON_INTEGER_MULTIPLE_OF_NOT_SUPPORTED",
              },
            }],
          );
        });
      });
    });
    describe("BOUND", () => {
      describe("MIN_GREATER_THAN_MAX", () => {
        it("case 1", () => {
          expectCompilationErrors(
            {
              type: "string",
              "x:checks": { minLength: 10, maxLength: 5 },
            } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:MIN_GREATER_THAN_MAX",
                comparisonTargetType: "string_length",
              },
            }],
          );
        });
        it("case 2", () => {
          expectCompilationErrors(
            { type: "int32", "x:checks": { minimum: 10, maximum: 5 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:MIN_GREATER_THAN_MAX",
                comparisonTargetType: "value",
              },
            }],
          );
        });
        it("case 3", () => {
          expectCompilationErrors(
            {
              elements: {},
              "x:checks": { minElements: 10, maxElements: 5 },
            } as any,
            [{
              schemaPath: ["elements"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:MIN_GREATER_THAN_MAX",
                comparisonTargetType: "elements",
              },
            }],
          );
        });
        it("case 4", () => {
          expectCompilationErrors(
            {
              properties: {},
              additionalProperties: true,
              "x:checks": { minProperties: 10, maxProperties: 5 },
            } as any,
            [{
              schemaPath: ["properties"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:MIN_GREATER_THAN_MAX",
                comparisonTargetType: "properties",
              },
            }],
          );
        });
        it("case 5", () => {
          expectCompilationErrors(
            { values: {}, "x:checks": { minValues: 10, maxValues: 5 } } as any,
            [{
              schemaPath: ["values"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:MIN_GREATER_THAN_MAX",
                comparisonTargetType: "values",
              },
            }],
          );
        });
      });
      describe("MIN_EQUAL_TO_MAX_WHILE_EXCLUSIVE", () => {
        it("case 1", () => {
          expectCompilationErrors(
            {
              type: "int32",
              "x:checks": { minimum: 10, exclusiveMaximum: 10 },
            } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:BOUND:MIN_EQUAL_TO_MAX_WHILE_EXCLUSIVE",
                comparisonTargetType: "value",
              },
            }],
          );
        });
      });
      describe("BOTH_EXCLUSIVE_AND_INCLUSIVE", () => {
        it("case 1", () => {
          expectCompilationErrors(
            {
              type: "int32",
              "x:checks": { minimum: 10, exclusiveMinimum: 10 },
            } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:BOTH_EXCLUSIVE_AND_INCLUSIVE",
                comparisonTargetType: "value",
                boundSide: "min",
              },
            }],
          );
        });
      });
      describe("NON_NUMERIC_BOUND", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "int32", "x:checks": { maximum: "foo" } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type: "EXTENSION:X_CHECKS:BOUND:NON_NUMERIC_BOUND",
                comparisonTargetType: "value",
                boundSide: "max",
                actualBoundType: "string",
              },
            }],
          );
        });
      });
      describe("NEGATIVE_BOUND_NOT_ALLOWED", () => {
        it("case 1", () => {
          expectCompilationErrors(
            { type: "string", "x:checks": { minLength: -10 } } as any,
            [{
              schemaPath: ["type"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:BOUND:NEGATIVE_OR_NON_INTEGER_BOUND_NOT_ALLOWED",
                comparisonTargetType: "string_length",
                boundSide: "min",
              },
            }],
          );
        });
        it("case 2", () => {
          expectCompilationErrors(
            { elements: {}, "x:checks": { maxElements: 0.1 } } as any,
            [{
              schemaPath: ["elements"],
              raw: {
                type:
                  "EXTENSION:X_CHECKS:BOUND:NEGATIVE_OR_NON_INTEGER_BOUND_NOT_ALLOWED",
                comparisonTargetType: "elements",
                boundSide: "max",
              },
            }],
          );
        });
      });
    });
  });
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

function expectCompilationErrors(
  schema: Schema,
  errors: CompilationError[],
) {
  expectCompilationErrorsBase(schema, errors, {
    compilationOptions: {
      breakingExtensions: [BreakingExtensions.xChecks],
    },
  });
}

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

function mustGetNewRegExpErrorMessage(patter: string): string {
  try {
    new RegExp(patter);
    throw new Error("unreachable");
  } catch (e) {
    return (e as SyntaxError).message;
  }
}

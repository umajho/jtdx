import { describe, expect, it } from "vitest";

import "../test-support/init";

import officialValidationJson from "../../../third-party/json-typedef-spec/tests/validation.json" assert {
  type: "json",
};

import {
  CompilationOptions,
  CompilationResult,
  compile,
} from "./compiling/mod";
import { Schema, TypeSchemaType } from "./types";
import { ValidationError } from "./errors";
import { JSONType } from "./utils/jsonTypeOf";

const ONLY = ((): RegExp | null => {
  return null;
})();

describe("Official", () => {
  for (
    const [name, data] of Object.entries(officialValidationJson)
  ) {
    const { schema, instance, errors } = data;
    const ox = errors.length ? "X" : "O";
    const jsonSchema = JSON.stringify(schema);
    const jsonInstance = JSON.stringify(instance);
    const caseName = `${name}: [${ox}] ${jsonSchema} ${jsonInstance}`;

    const caseFn = () => {
      const validator = (() => {
        const compileResult = compile(schema as any, { extensions: null });
        expect(compileResult).compilationToBeOk();
        return (compileResult as Extract<CompilationResult, { isOk: true }>)
          .validator;
      })();

      const result = validator.validate(instance);
      if (errors.length === 0) {
        expect(result).validationToBeOk();
      } else {
        expect(result).validationToBeNotOk(errors);
      }
    };
    if (ONLY && ONLY.test(name)) {
      it.only(caseName, caseFn);
    } else {
      it(caseName, caseFn);
    }
  }
});

describe("Errors", () => {
  describe("TYPE_FORM", () => {
    describe("TYPE_FORM:TYPE_MISMATCH", () => {
      const table: { type: TypeSchemaType; data: any; actualType: JSONType }[] =
        [
          { type: "string", data: 42, actualType: "number" },
          { type: "uint8", data: -1, actualType: "number" },
          { type: "timestamp", data: "foo", actualType: "string" },
        ];
      for (const [i, { type, data, actualType }] of table.entries()) {
        it(`case ${i + 1}`, () => {
          expectError(
            { type },
            data,
            [{
              schemaPath: ["type"],
              instancePath: [],
              raw: {
                type: "TYPE_FORM:TYPE_MISMATCH",
                expectedType: type,
                actualType,
              },
            }],
          );
        });
      }
    });

    describe("TYPE_FORM:TYPE_MISMATCH:NOT_INTEGER", () => {
      it("case 1", () => {
        expectError(
          { type: "uint8" },
          1.5,
          [{
            schemaPath: ["type"],
            instancePath: [],
            raw: {
              type: "TYPE_FORM:TYPE_MISMATCH:NOT_INTEGER",
              expectedType: "uint8",
            },
          }],
        );
      });
    });
  });

  describe("ENUM_FORM", () => {
    describe("ENUM_FORM:NOT_STRING", () => {
      it("case 1", () => {
        expectError(
          { enum: ["foo"] },
          42,
          [{
            schemaPath: ["enum"],
            instancePath: [],
            raw: { type: "ENUM_FORM:NOT_STRING", actualType: "number" },
          }],
        );
      });
    });

    describe("ENUM_FORM:INVALID_VARIANT", () => {
      it("case 1", () => {
        expectError(
          { enum: ["foo"] },
          "bar",
          [{
            schemaPath: ["enum"],
            instancePath: [],
            raw: { type: "ENUM_FORM:INVALID_VARIANT", actualValue: "bar" },
          }],
        );
      });
    });
  });

  describe("ELEMENTS_FORM", () => {
    describe("ELEMENTS_FORM:NOT_ARRAY", () => {
      it("case 1", () => {
        expectError(
          { elements: { type: "string" } },
          42,
          [{
            schemaPath: ["elements"],
            instancePath: [],
            raw: { type: "ELEMENTS_FORM:NOT_ARRAY", actualType: "number" },
          }],
        );
      });
    });
  });

  describe("PROPERTIES_FORM", () => {
    describe("PROPERTIES_FORM:NOT_OBJECT", () => {
      it("case 1", () => {
        expectError(
          { properties: {} },
          42,
          [{
            schemaPath: ["properties"],
            instancePath: [],
            raw: { type: "PROPERTIES_FORM:NOT_OBJECT", actualType: "number" },
          }],
        );
      });
    });

    describe("PROPERTIES_FORM:MISSING_REQUIRED_PROPERTY", () => {
      it("case 1", () => {
        expectError(
          { properties: { foo: { type: "string" } } },
          {},
          [{
            schemaPath: ["properties", "foo"],
            instancePath: [],
            raw: {
              type: "PROPERTIES_FORM:MISSING_REQUIRED_PROPERTY",
              key: "foo",
            },
          }],
        );
      });
    });

    describe("PROPERTIES_FORM:UNEXPECTED_ADDITIONAL_PROPERTY", () => {
      it("case 1", () => {
        expectError(
          { properties: {} },
          { foo: 42 },
          [{
            schemaPath: [],
            instancePath: ["foo"],
            raw: {
              type: "PROPERTIES_FORM:UNEXPECTED_ADDITIONAL_PROPERTY",
              key: "foo",
            },
          }],
        );
      });
    });
  });

  describe("VALUES_FORM", () => {
    describe("VALUES_FORM:NOT_OBJECT", () => {
      it("case 1", () => {
        expectError(
          { values: { type: "string" } },
          42,
          [{
            schemaPath: ["values"],
            instancePath: [],
            raw: { type: "VALUES_FORM:NOT_OBJECT", actualType: "number" },
          }],
        );
      });
    });
  });

  describe("DISCRIMINATOR_FORM", () => {
    describe("DISCRIMINATOR_FORM:NOT_OBJECT", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo", mapping: { bar: { properties: {} } } },
          42,
          [{
            schemaPath: ["discriminator"],
            instancePath: [],
            raw: {
              type: "DISCRIMINATOR_FORM:NOT_OBJECT",
              actualType: "number",
            },
          }],
        );
      });
    });

    describe("DISCRIMINATOR_FORM:MISSING_DISCRIMINATOR", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo", mapping: { bar: { properties: {} } } },
          {},
          [{
            schemaPath: ["discriminator"],
            instancePath: [],
            raw: {
              type: "DISCRIMINATOR_FORM:MISSING_DISCRIMINATOR",
              discriminator: "foo",
            },
          }],
        );
      });
    });

    describe("DISCRIMINATOR_FORM:DISCRIMINATOR_VALUE_NOT_STRING", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo", mapping: { bar: { properties: {} } } },
          { foo: 42 },
          [{
            schemaPath: ["discriminator"],
            instancePath: ["foo"],
            raw: {
              type: "DISCRIMINATOR_FORM:DISCRIMINATOR_VALUE_NOT_STRING",
              actualType: "number",
            },
          }],
        );
      });
    });

    describe("DISCRIMINATOR_FORM:INVALID_DISCRIMINATOR_VALUE", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo", mapping: { bar: { properties: {} } } },
          { foo: "baz" },
          [{
            schemaPath: ["mapping"],
            instancePath: ["foo"],
            raw: {
              type: "DISCRIMINATOR_FORM:INVALID_DISCRIMINATOR_VALUE",
              actualDiscriminatorValue: "baz",
            },
          }],
        );
      });
    });
  });
});

function expectError(
  schema: Schema,
  data: any,
  errors: ValidationError[],
  opts?: {
    compilationOptions: CompilationOptions;
  },
) {
  const compOpts = opts?.compilationOptions ?? { extensions: null };

  const compResult = compile(schema, compOpts);
  expect(compResult).compilationToBeOk();
  const validator =
    (compResult as Extract<CompilationResult, { isOk: true }>).validator;

  expect(validator.validate(data)).toEqual({ isOk: false, errors });
}

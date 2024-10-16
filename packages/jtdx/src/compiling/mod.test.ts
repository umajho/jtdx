import { describe, expect, it } from "vitest";

import { expectError } from "../../test-support/utils";

import { compile } from "./mod";

import officialInvalidSchemasJson from "../../../../third-party/json-typedef-spec/tests/invalid_schemas.json" assert {
  type: "json",
};

describe("Official", () => {
  for (const [name, schema] of Object.entries(officialInvalidSchemasJson)) {
    const caseName = `${name}: ${JSON.stringify(schema)}`;

    it(caseName, () => {
      const compileResult = compile(schema as any, { extensions: null });
      expect(compileResult.isOk).toBe(false);
    });
  }
});

describe("Errors", () => {
  describe("SCHEMA_FORM", () => {
    describe("SCHEMA_FORM:AMBIGUOUS", () => {
      it("case 1", () => {
        expectError(
          { type: "string", properties: {} } as any,
          [{
            schemaPath: [],
            raw: {
              type: "SCHEMA_FORM:AMBIGUOUS",
              discriminatorKeys: ["type", "properties"],
            },
          }],
        );
      });
    });

    describe("SCHEMA_FORM:NOT_OBJECT", () => {
      it("case 1", () => {
        expectError(
          42 as any,
          [{
            schemaPath: [],
            raw: { type: "SCHEMA_FORM:NOT_OBJECT", actualType: "number" },
          }],
        );
      });
    });
  });

  describe("MAPPING", () => {
    describe("MAPPING:NON_PROPERTIES_SCHEMA_FORM", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo", mapping: { bar: { type: "string" } } } as any,
          [{
            schemaPath: ["mapping", "bar"],
            raw: { type: "MAPPING:NON_PROPERTIES_SCHEMA_FORM", form: "type" },
          }],
        );
      });
    });

    describe("MAPPING:NULLABLE", () => {
      it("case 1", () => {
        expectError(
          {
            discriminator: "foo",
            mapping: { bar: { properties: {}, nullable: true } } as any,
          },
          [{
            schemaPath: ["mapping", "bar"],
            raw: { type: "MAPPING:NULLABLE" },
          }],
        );
      });
    });

    describe("MAPPING:DISCRIMINATOR_AS_PROPERTY_KEY", () => {
      it("case 1", () => {
        expectError(
          {
            discriminator: "foo",
            mapping: { bar: { properties: { foo: {} } } },
          },
          [{
            schemaPath: ["mapping", "bar"],
            raw: {
              type: "MAPPING:DISCRIMINATOR_AS_PROPERTY_KEY",
              discriminator: "foo",
            },
          }],
        );
      });
    });
  });

  describe("NON_ROOT_SCHEMA", () => {
    describe("NON_ROOT_SCHEMA:ROOT_ONLY_KEYS", () => {
      it("case 1", () => {
        expectError(
          { elements: { definitions: {} } } as any,
          [{
            schemaPath: ["elements"],
            raw: {
              type: "NON_ROOT_SCHEMA:ROOT_ONLY_KEYS",
              keys: ["definitions"],
            },
          }],
        );
      });
    });
  });

  describe("COMMON_SCHEMA", () => {
    describe("COMMON_SCHEMA:UNRECOGNIZED_KEYS", () => {
      it("case 1", () => {
        expectError(
          { unknown: 42 } as any,
          [{
            schemaPath: [],
            raw: {
              type: "COMMON_SCHEMA:UNRECOGNIZED_KEYS",
              form: "empty",
              keys: ["unknown"],
            },
          }],
        );
      });
    });

    describe("COMMON_SCHEMA:NON_BOOLEAN_NULLABLE_VALUE", () => {
      it("case 1", () => {
        expectError(
          { type: "string", nullable: 42 } as any,
          [{
            schemaPath: [],
            raw: {
              type: "COMMON_SCHEMA:NON_BOOLEAN_NULLABLE_VALUE",
              actualType: "number",
            },
          }],
        );
      });
    });
  });

  describe("TYPE_FORM", () => {
    describe("TYPE_FORM:UNKNOWN_TYPE", () => {
      it("case 1", () => {
        expectError(
          { type: "unknown" } as any,
          [{
            schemaPath: ["type"],
            raw: { type: "TYPE_FORM:UNKNOWN_TYPE", actualType: "unknown" },
          }],
        );
      });
    });

    describe("TYPE_FORM:NON_STRING_TYPE", () => {
      it("case 1", () => {
        expectError(
          { type: 42 } as any,
          [{
            schemaPath: ["type"],
            raw: {
              type: "TYPE_FORM:NON_STRING_TYPE",
              actualTypeType: "number",
            },
          }],
        );
      });
    });
  });

  describe("ENUM_FORM", () => {
    describe("ENUM_FORM:NON_ARRAY_ENUM", () => {
      it("case 1", () => {
        expectError(
          { enum: 42 } as any,
          [{
            schemaPath: ["enum"],
            raw: {
              type: "ENUM_FORM:NON_ARRAY_ENUM",
              actualEnumType: "number",
            },
          }],
        );
      });
    });

    describe("ENUM_FORM:EMPTY_ENUM", () => {
      it("case 1", () => {
        expectError(
          { enum: [] } as any,
          [{
            schemaPath: ["enum"],
            raw: { type: "ENUM_FORM:EMPTY_ENUM" },
          }],
        );
      });
    });

    describe("ENUM_FORM:NON_STRING_VARIANTS", () => {
      it("case 1", () => {
        expectError(
          { enum: [42] } as any,
          [{
            schemaPath: ["enum"],
            raw: { type: "ENUM_FORM:NON_STRING_VARIANTS" },
          }],
        );
      });
    });

    describe("ENUM_FORM:DUPLICATE_VARIANTS", () => {
      it("case 1", () => {
        expectError(
          { enum: ["foo", "foo"] } as any,
          [{
            schemaPath: ["enum"],
            raw: {
              type: "ENUM_FORM:DUPLICATE_VARIANTS",
              duplicateVariants: ["foo"],
            },
          }],
        );
      });
    });
  });

  describe("PROPERTIES_FORM", () => {
    describe("PROPERTIES_FORM:NON_OBJECT_PROPERTIES", () => {
      it("case 1", () => {
        expectError(
          { properties: 42 } as any,
          [{
            schemaPath: ["properties"],
            raw: {
              type: "PROPERTIES_FORM:NON_OBJECT_PROPERTIES",
              actualPropertiesType: "number",
            },
          }],
        );
      });
    });

    describe("PROPERTIES_FORM:NON_OBJECT_OPTIONAL_PROPERTIES", () => {
      it("case 1", () => {
        expectError(
          { optionalProperties: 42 } as any,
          [{
            schemaPath: ["optionalProperties"],
            raw: {
              type: "PROPERTIES_FORM:NON_OBJECT_OPTIONAL_PROPERTIES",
              actualOptionalPropertiesType: "number",
            },
          }],
        );
      });
    });

    describe("PROPERTIES_FORM:OVERLAPPING_REQUIRED_AND_OPTIONAL_PROPERTIES", () => {
      it("case 1", () => {
        expectError(
          { properties: { foo: {} }, optionalProperties: { foo: {} } },
          [{
            schemaPath: ["optionalProperties"],
            raw: {
              type:
                "PROPERTIES_FORM:OVERLAPPING_REQUIRED_AND_OPTIONAL_PROPERTIES",
              keys: ["foo"],
            },
          }],
        );
      });
    });

    describe("PROPERTIES_FORM:NON_BOOLEAN_ADDITIONAL_PROPERTIES", () => {
      it("case 1", () => {
        expectError(
          { properties: {}, additionalProperties: 42 } as any,
          [{
            schemaPath: ["additionalProperties"],
            raw: {
              type: "PROPERTIES_FORM:NON_BOOLEAN_ADDITIONAL_PROPERTIES",
              actualAdditionalPropertiesType: "number",
            },
          }],
        );
      });
    });
  });

  describe("DISCRIMINATOR_FORM", () => {
    describe("DISCRIMINATOR_FORM:NON_STRING_DISCRIMINATOR", () => {
      it("case 1", () => {
        expectError(
          { discriminator: 42, mapping: { foo: { properties: {} } } } as any,
          [{
            schemaPath: [],
            raw: {
              type: "DISCRIMINATOR_FORM:NON_STRING_DISCRIMINATOR",
              actualDiscriminatorType: "number",
            },
          }],
        );
      });
    });

    describe("DISCRIMINATOR_FORM:MISSING_MAPPING", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo" } as any,
          [{
            schemaPath: [],
            raw: { type: "DISCRIMINATOR_FORM:MISSING_MAPPING" },
          }],
        );
      });
    });

    describe("DISCRIMINATOR_FORM:NON_OBJECT_MAPPING", () => {
      it("case 1", () => {
        expectError(
          { discriminator: "foo", mapping: 42 } as any,
          [{
            schemaPath: [],
            raw: {
              type: "DISCRIMINATOR_FORM:NON_OBJECT_MAPPING",
              actualMappingType: "number",
            },
          }],
        );
      });
    });
  });

  describe("REF_FORM", () => {
    describe("REF_FORM:NON_STRING_REF", () => {
      it("case 1", () => {
        expectError(
          { ref: 42 } as any,
          [{
            schemaPath: ["ref"],
            raw: { type: "REF_FORM:NON_STRING_REF", actualRefType: "number" },
          }],
        );
      });
    });

    describe("REF_FORM:NO_DEFINITION", () => {
      it("case 1", () => {
        expectError(
          { ref: "foo" } as any,
          [{
            schemaPath: ["ref"],
            raw: { type: "REF_FORM:NO_DEFINITION", definition: "foo" },
          }],
        );
      });
    });
  });

  describe("DEFINITIONS", () => {
    describe("DEFINITIONS:NON_OBJECT_DEFINITIONS", () => {
      it("case 1", () => {
        expectError(
          { definitions: 42 } as any,
          [{
            schemaPath: [],
            raw: {
              type: "DEFINITIONS:NON_OBJECT_DEFINITIONS",
              actualDefinitionsType: "number",
            },
          }],
        );
      });
    });

    describe("DEFINITIONS:NOOP_CIRCULAR_REFERENCES_DETECTED", () => {
      it("case 1", () => {
        expectError(
          { definitions: { foo: { ref: "foo" } } } as any,
          [{
            schemaPath: [],
            raw: {
              type: "DEFINITIONS:NOOP_CIRCULAR_REFERENCES_DETECTED",
              definitionsInCycle: ["foo"],
            },
          }],
        );
      });
    });
  });
});

import { CompilationRawErrorByExtensionDisallowEmptyMappings } from "./extensions/disallow-empty-mappings";
import {
  CompilationRawErrorByExtensionXChecks,
  ValidationRawErrorByExtensionXChecks,
} from "./extensions/x-checks/errors";
import {
  SchemaType as SchemaForm,
  TypeSchemaType,
  TypeSchemaTypeInteger,
} from "./types";
import { JSONType } from "./utils/jsonTypeOf";

export interface CompilationError {
  schemaPath: string[];
  raw: CompilationRawError;
}
export function createCompilationError(
  schemaPath: string[],
  raw: CompilationRawError,
): CompilationError {
  return { schemaPath, raw };
}

export type CompilationRawError =
  // e.g. `{ "type": "string", "properties": {} }` => `{ ..., discriminatorKeys: ["type", "properties"] }`.
  | { type: "SCHEMA_FORM:AMBIGUOUS"; discriminatorKeys: string[] }
  // e.g. `42` => `{ ..., actualType: "number" }`.
  | { type: "SCHEMA_FORM:NOT_OBJECT"; actualType: JSONType }
  // e.g. `{ "discriminator": "foo", "mapping": { "bar": { "type": "string" } } }`.
  | { type: "MAPPING:NON_PROPERTIES_SCHEMA_FORM"; form: SchemaForm }
  // e.g. `{ "discriminator": "foo", "mapping": { "bar": { "properties": {}, "nullable": true } } }`.
  | { type: "MAPPING:NULLABLE" }
  // e.g. `{ "discriminator": "foo", "mapping": { "bar": { "properties": { "foo": {} } } } }` => { ..., discriminator: "foo" }.
  | { type: "MAPPING:DISCRIMINATOR_AS_PROPERTY_KEY"; discriminator: string }
  // e.g. `{ "elements": { "definitions": {} } }` => `{ ..., keys: ["definitions"] }`.
  | { type: "NON_ROOT_SCHEMA:ROOT_ONLY_KEYS"; keys: string[] }
  // e.g. `{ "unknown": 42 }` => `{ ..., form: "type", keys: ["unknown"] }`.
  | {
    type: "COMMON_SCHEMA:UNRECOGNIZED_KEYS";
    form: SchemaForm;
    keys: string[];
  }
  // e.g. `{ "type": "string", "nullable": 42 }`.
  | { type: "COMMON_SCHEMA:NON_BOOLEAN_NULLABLE_VALUE"; actualType: JSONType }
  // e.g. `{ "type": "unknown" }` => `{ ..., actualType: "unknown" }`.
  | { type: "TYPE_FORM:UNKNOWN_TYPE"; actualType: string }
  // e.g. `{ "type": 42 }` => `{ ..., actualTypeType: "number" }`.
  | { type: "TYPE_FORM:NON_STRING_TYPE"; actualTypeType: JSONType }
  // e.g. `{ "enum": 42 }` => `{ ..., actualEnumType: "number" }`.
  | { type: "ENUM_FORM:NON_ARRAY_ENUM"; actualEnumType: JSONType }
  // e.g. `{ "enum": [] }`.
  | { type: "ENUM_FORM:EMPTY_ENUM" }
  // e.g. `{ "enum": [42] }`.
  | { type: "ENUM_FORM:NON_STRING_VARIANTS" }
  // e.g. `{ "enum": ["foo", "foo"] }` => `{ ..., duplicateVariants: ["foo"] }`
  | { type: "ENUM_FORM:DUPLICATE_VARIANTS"; duplicateVariants: string[] }
  // e.g. `{ "properties": 42 }` => `{ ..., actualPropertiesType: "number" }`.
  | {
    type: "PROPERTIES_FORM:NON_OBJECT_PROPERTIES";
    actualPropertiesType: JSONType;
  }
  // e.g. `{ "optionalProperties": 42 }` => `{ ..., actualOptionalPropertiesType: "number" }`
  | {
    type: "PROPERTIES_FORM:NON_OBJECT_OPTIONAL_PROPERTIES";
    actualOptionalPropertiesType: JSONType;
  }
  // e.g. `{ "properties": { "foo": {} }, "optionalProperties": { "foo": {} } }` => `{ ..., keys: ["foo"] }`.
  | {
    type: "PROPERTIES_FORM:OVERLAPPING_REQUIRED_AND_OPTIONAL_PROPERTIES";
    keys: string[];
  }
  // e.g. `{ "properties": {}, "additionalProperties": 42 }` => `{ ..., actualAdditionalPropertiesType: "number" }`.
  | {
    type: "PROPERTIES_FORM:NON_BOOLEAN_ADDITIONAL_PROPERTIES";
    actualAdditionalPropertiesType: JSONType;
  }
  // e.g. `{ "discriminator": 42, "mapping": { "foo": { "properties": {} } } }` => `{ ..., actualDiscriminatorType: "number" }`.
  | {
    type: "DISCRIMINATOR_FORM:NON_STRING_DISCRIMINATOR";
    actualDiscriminatorType: JSONType;
  }
  // e.g. `{ "discriminator": "foo" }`.
  | { type: "DISCRIMINATOR_FORM:MISSING_MAPPING" }
  // e.g. `{ "discriminator": "foo", "mapping": 42 }` => `{ ..., actualMappingType: "number" }`.
  | {
    type: "DISCRIMINATOR_FORM:NON_OBJECT_MAPPING";
    actualMappingType: JSONType;
  }
  // e.g. `{ "ref": 42 }` => `{ ..., actualRefType: "number" }`.
  | { type: "REF_FORM:NON_STRING_REF"; actualRefType: JSONType }
  // e.g. `{ "ref": "foo" }` => `{ ..., definition: "foo" }`.
  | { type: "REF_FORM:NO_DEFINITION"; definition: string }
  // e.g. `{ "definitions": 42 }` => `{ ..., actualDefinitionsType: "number" }`.
  | {
    type: "DEFINITIONS:NON_OBJECT_DEFINITIONS";
    actualDefinitionsType: JSONType;
  }
  // e.g. `{ "definitions": { "foo": { "ref": "foo" } } }` => `{ ..., definitionsInCycle: ["foo"] }`.
  | {
    type: "DEFINITIONS:NOOP_CIRCULAR_REFERENCES_DETECTED";
    definitionsInCycle: string[];
  }
  | CompilationRawErrorByExtensionDisallowEmptyMappings
  | CompilationRawErrorByExtensionXChecks;

export interface ValidationError {
  instancePath: string[];
  schemaPath: string[];
  raw: ValidationRawError;
}

/**
 * TODO: If the localizer accepts schemas, some properties (like `expectedType`,
 * `discriminator`) are not necessary, since they can be extracted by schemas
 * with schema paths.
 */
export type ValidationRawError =
  | {
    type: "TYPE_FORM:TYPE_MISMATCH";
    /**
      NOTE: If the type it represents has a range, it should be included in the
      error message.
     */
    expectedType: TypeSchemaType;
    /**
      - If `expectedType` is `"timestamp"` and this is `"string"`, it means the
        format is invalid (not RFC3339);
      - if `expectedType` is of an integer type, and this is `"number"`, it
        means the value is out of range.
   */
    actualType: JSONType;
  }
  | {
    type: "TYPE_FORM:TYPE_MISMATCH:NOT_INTEGER";
    expectedType: TypeSchemaTypeInteger;
  }
  | { type: "ENUM_FORM:NOT_STRING"; actualType: JSONType }
  | { type: "ENUM_FORM:INVALID_VARIANT"; actualValue: string }
  | { type: "ELEMENTS_FORM:NOT_ARRAY"; actualType: JSONType }
  | { type: "PROPERTIES_FORM:NOT_OBJECT"; actualType: JSONType }
  | { type: "PROPERTIES_FORM:MISSING_REQUIRED_PROPERTY"; key: string }
  | { type: "PROPERTIES_FORM:UNEXPECTED_ADDITIONAL_PROPERTY"; key: string }
  | { type: "VALUES_FORM:NOT_OBJECT"; actualType: JSONType }
  | { type: "DISCRIMINATOR_FORM:NOT_OBJECT"; actualType: JSONType }
  | { type: "DISCRIMINATOR_FORM:MISSING_DISCRIMINATOR"; discriminator: string }
  | {
    type: "DISCRIMINATOR_FORM:DISCRIMINATOR_VALUE_NOT_STRING";
    actualType: JSONType;
  }
  | {
    type: "DISCRIMINATOR_FORM:INVALID_DISCRIMINATOR_VALUE";
    actualDiscriminatorValue: string;
  }
  | ValidationRawErrorByExtensionXChecks;

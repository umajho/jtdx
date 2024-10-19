import { TypeSchemaType } from "../../types";
import { JSONType } from "../../utils/jsonTypeOf";

import { ComparisonTargetType } from "./mod";

export const ERROR_PREFIX = "EXTENSION:X_CHECKS" as const;

/**
 * CET = Compilation Error Types.
 */
export const CET = {
  X_OBJECT: {
    NOT_OBJECT: `${ERROR_PREFIX}:X_OBJECT:NOT_OBJECT`,
    SURPLUS_PROPERTIES: `${ERROR_PREFIX}:X_OBJECT:SURPLUS_PROPERTIES`,
  },
  TYPE_FORM: {
    LENGTH_ON_NON_STRING: `${ERROR_PREFIX}:TYPE_FORM:LENGTH_ON_NON_STRING`,
    PATTERN_ON_NON_STRING: `${ERROR_PREFIX}:TYPE_FORM:PATTERN_ON_NON_STRING`,
    NON_STRING_PATTERN: `${ERROR_PREFIX}:TYPE_FORM:NON_STRING_PATTERN`,
    INVALID_PATTERN: `${ERROR_PREFIX}:TYPE_FORM:INVALID_PATTERN`,
    BOUND_ON_NON_BOUNDABLE: `${ERROR_PREFIX}:TYPE_FORM:BOUND_ON_NON_BOUNDABLE`,
    NON_STRING_BOUND_ON_TIMESTAMP:
      `${ERROR_PREFIX}:TYPE_FORM:NON_STRING_BOUND_ON_TIMESTAMP`,
    NON_RFC3339_BOUND_ON_TIMESTAMP:
      `${ERROR_PREFIX}:TYPE_FORM:NON_RFC3339_BOUND_ON_TIMESTAMP`,
    NON_INTEGER_BOUND_ON_INTEGER:
      `${ERROR_PREFIX}:TYPE_FORM:NON_INTEGER_BOUND_ON_INTEGER`,
    BOUND_OUT_OF_RANGE: `${ERROR_PREFIX}:TYPE_FORM:BOUND_OUT_OF_RANGE`,
    MULTIPLE_OF_ON_NON_NUMERIC:
      `${ERROR_PREFIX}:TYPE_FORM:MULTIPLE_OF_ON_NON_NUMERIC`,
    MULTIPLE_OF_ON_NON_INTEGER_NUMERIC_NOT_SUPPORTED:
      `${ERROR_PREFIX}:TYPE_FORM:MULTIPLE_OF_ON_NON_INTEGER_NUMERIC_NOT_SUPPORTED`,
    NON_NUMERIC_MULTIPLE_OF:
      `${ERROR_PREFIX}:TYPE_FORM:NON_NUMERIC_MULTIPLE_OF`,
    NON_INTEGER_MULTIPLE_OF_NOT_SUPPORTED:
      `${ERROR_PREFIX}:TYPE_FORM:NON_INTEGER_MULTIPLE_OF_NOT_SUPPORTED`,
  },
  BOUND: {
    MIN_GREATER_THAN_MAX: `${ERROR_PREFIX}:BOUND:MIN_GREATER_THAN_MAX`,
    MIN_EQUAL_TO_MAX_WHILE_EXCLUSIVE:
      `${ERROR_PREFIX}:BOUND:MIN_EQUAL_TO_MAX_WHILE_EXCLUSIVE`,
    BOTH_EXCLUSIVE_AND_INCLUSIVE:
      `${ERROR_PREFIX}:BOUND:BOTH_EXCLUSIVE_AND_INCLUSIVE`,
    NON_NUMERIC_BOUND: `${ERROR_PREFIX}:BOUND:NON_NUMERIC_BOUND`,
    NEGATIVE_OR_NON_INTEGER_BOUND_NOT_ALLOWED:
      `${ERROR_PREFIX}:BOUND:NEGATIVE_OR_NON_INTEGER_BOUND_NOT_ALLOWED`,
  },
} as const;

/**
 * VET = Validation Error Types.
 */
export const VET = {
  PATTERN_MISMATCH: `${ERROR_PREFIX}:PATTERN_MISMATCH`,
  NOT_MULTIPLE_OF: `${ERROR_PREFIX}:NOT_MULTIPLE_OF`,
  ELEMENTS_NOT_UNIQUE: `${ERROR_PREFIX}:ELEMENTS_NOT_UNIQUE`,
  OUT_OF_BOUND: `${ERROR_PREFIX}:OUT_OF_BOUND`,
} as const;

/**
 * For breaking extension `x:checks`.
 *
 * TODO: see TODO of `CompilationRawError`.
 */
export type CompilationRawErrorByExtensionXChecks =
  // e.g. `{ "x:checks": 42 }`.
  | { type: typeof CET.X_OBJECT.NOT_OBJECT }
  // e.g. `{ "x:checks": { "foo": 42 } }` -> `{ ..., keys: ["foo"] }`.
  | { type: typeof CET.X_OBJECT.SURPLUS_PROPERTIES; keys: string[] }
  // e.g. `{ "type": "int8", "x:checks": { "minLength": 3 } }` -> `{ ..., actualType: "int8" }`.
  | {
    type: typeof CET.TYPE_FORM.LENGTH_ON_NON_STRING;
    actualType: TypeSchemaType;
  }
  // e.g. `{ "type": "int8", "x:checks": { "pattern": "^foo$" } }` -> `{ ..., actualType: "int8" }`.
  | {
    type: typeof CET.TYPE_FORM.PATTERN_ON_NON_STRING;
    actualType: TypeSchemaType;
  }
  // e.g. `{ "type": "int8", "x:checks": { "pattern": 42 } }` -> `{ ..., patternType: "number" }`.
  | {
    type: typeof CET.TYPE_FORM.NON_STRING_PATTERN;
    patternType: JSONType;
  }
  // e.g. `{ "type": "string", "x:checks": { "pattern": "(" } }` -> `{ ..., errorMessage: … }`.
  | {
    type: typeof CET.TYPE_FORM.INVALID_PATTERN;
    errorMessage: string;
  }
  // e.g. `{ "type": "string", "x:checks": { "maximum": 3 } }` -> `{ ..., boundSide: "max", actualType: "string" }`.
  | {
    type: typeof CET.TYPE_FORM.BOUND_ON_NON_BOUNDABLE;
    boundSide: "min" | "max";
    actualType: TypeSchemaType;
  }
  // e.g.. `{ "type": "timestamp", "x:checks": { "minimum": 42 } }` -> `{ ..., boundSide: "min", boundType: "number" }`.
  | {
    type: typeof CET.TYPE_FORM.NON_STRING_BOUND_ON_TIMESTAMP;
    boundSide: "min" | "max";
    actualBoundType: JSONType;
  }
  // e.g. `{ "type": "timestamp", "x:checks": { "minimum": "foo" } }` -> `{ ..., boundSide: "min" }`.
  | {
    type: typeof CET.TYPE_FORM.NON_RFC3339_BOUND_ON_TIMESTAMP;
    boundSide: "min" | "max";
  }
  // e.g. `{ "type": "int32", "x:checks": { "minimum": 0.1 } }` -> `{ ..., boundSide: "min" }`.
  | {
    type: typeof CET.TYPE_FORM.NON_INTEGER_BOUND_ON_INTEGER;
    boundSide: "min" | "max";
  }
  // e.g. `{ "type": "uint8", "x:checks": { "minimum": 256 } }` -> `{ ..., boundSide: "min", typeType: "uint8" }`.
  | {
    type: typeof CET.TYPE_FORM.BOUND_OUT_OF_RANGE;
    boundSide: "min" | "max";
    typeType: TypeSchemaType;
  }
  // e.g. `{ "type": "string", "x:checks": { "multipleOf": 10 } }`.
  | { type: typeof CET.TYPE_FORM.MULTIPLE_OF_ON_NON_NUMERIC }
  // e.g. `{ "type": "float32", "x:checks": { "multipleOf": 10 } }`.
  | {
    type: typeof CET.TYPE_FORM.MULTIPLE_OF_ON_NON_INTEGER_NUMERIC_NOT_SUPPORTED;
  }
  // e.g. `{ "type": "int32", "x:checks": { "multipleOf": "foo" } }`.
  | { type: typeof CET.TYPE_FORM.NON_NUMERIC_MULTIPLE_OF }
  // e.g. `{ "type": "int32", "x:checks": { "multipleOf": 0.1 } }`.
  | { type: typeof CET.TYPE_FORM.NON_INTEGER_MULTIPLE_OF_NOT_SUPPORTED }
  // e.g. `{ "type": "int32", "x:checks": { "minimum": 10, "maximum": 5 } }` -> `{ ..., comparisonTargetType: "value" }`.
  | {
    type: typeof CET.BOUND.MIN_GREATER_THAN_MAX;
    comparisonTargetType: ComparisonTargetType;
  }
  // e.g. `{ "type": "int32", "x:checks": { "minimum": 10, "exclusiveMaximum": 10 } }` -> `{ ..., comparisonTargetType: "value" }`.
  | {
    type: typeof CET.BOUND.MIN_EQUAL_TO_MAX_WHILE_EXCLUSIVE;
    comparisonTargetType: ComparisonTargetType;
  }
  // e.g. `{ "type": "int32", "x:checks": { "minimum": 10, "exclusiveMinimum": 10 } }` -> `{ ..., comparisonTargetType: "value", boundSide: "min" }`.
  | {
    type: typeof CET.BOUND.BOTH_EXCLUSIVE_AND_INCLUSIVE;
    comparisonTargetType: ComparisonTargetType;
    boundSide: "min" | "max";
  }
  // e.g. `{ "type": "string", "x:checks": { "maximum": "foo" } }` -> `{ ..., comparisonTargetType: "value", boundSide: "max", boundType: "string" }`.
  | {
    type: typeof CET.BOUND.NON_NUMERIC_BOUND;
    comparisonTargetType: ComparisonTargetType;
    boundSide: "min" | "max";
    actualBoundType: JSONType;
  }
  // e.g. `{ "type": "string", "x:checks": { "minLength": -10 } }` -> `{ ..., comparisonTargetType: "string_length", boundSide: "min" }`.
  | {
    type: typeof CET.BOUND.NEGATIVE_OR_NON_INTEGER_BOUND_NOT_ALLOWED;
    comparisonTargetType: ComparisonTargetType;
    boundSide: "min" | "max";
  };

/**
 * For breaking extension `x:checks`.
 *
 * TODO: see TODO of `ValidationRawError`.
 */
export type ValidationRawErrorByExtensionXChecks =
  | { type: typeof VET.PATTERN_MISMATCH; pattern: string }
  | { type: typeof VET.NOT_MULTIPLE_OF; multipleOf: number }
  | { type: typeof VET.ELEMENTS_NOT_UNIQUE }
  | {
    type: typeof VET.OUT_OF_BOUND;
    comparisonTargetType: ComparisonTargetType;
    bound: number;
    targetBeingWhatThanBound: "<" | ">" | "<=" | ">=";
  };

import {
  runSupplementalValidateFunctions,
  SupplementalValidateFunction,
} from "./compiling/hooks";
import { ValidationError, ValidationRawError } from "./errors";
import { TypeSchemaTypeInteger } from "./types";
import isRFC3339 from "./utils/isRFC3339";
import { jsonTypeOf } from "./utils/jsonTypeOf";

export interface InternalValidator {
  validate: (
    value: any,
    instancePath: string[],
    refs: ValidationReferences,
  ) => void;
}

export interface ValidationReferences {
  errors: ValidationError[];
}

export interface ValidationOptions {
  isNullable?: true;
  supplementalValidateFunctions?: SupplementalValidateFunction[];
}

export function validateEmpty(
  v: any,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateBoolean(
  v: any,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "boolean") {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH",
      expectedType: "boolean",
      actualType: t,
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateString(
  v: any,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "string") {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH",
      expectedType: "string",
      actualType: t,
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateTimestamp(
  v: any,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "string" || !isRFC3339(v)) {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH",
      expectedType: "timestamp",
      actualType: t,
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateFloat(
  v: any,
  which: "float32" | "float64",
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "number") {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH",
      expectedType: which,
      actualType: t,
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateInteger(
  v: any,
  which: TypeSchemaTypeInteger,
  min: number,
  max: number,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "number") {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH",
      expectedType: which,
      actualType: t,
    });
    return;
  }

  if (!Number.isInteger(v)) {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH:NOT_INTEGER",
      expectedType: which,
    });
    return;
  }

  if (v < min || v > max) {
    pushError(schemaPath, instancePath, refs, {
      type: "TYPE_FORM:TYPE_MISMATCH",
      expectedType: which,
      actualType: "number",
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateEnum(
  v: any,
  variants: Set<string>,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "string") {
    pushError(schemaPath, instancePath, refs, {
      type: "ENUM_FORM:NOT_STRING",
      actualType: t,
    });
  } else if (!variants.has(v)) {
    pushError(schemaPath, instancePath, refs, {
      type: "ENUM_FORM:INVALID_VARIANT",
      actualValue: v,
    });
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });
}

export function validateElements(
  v: any,
  subValidateFn: InternalValidator["validate"],
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "array") {
    pushError(schemaPath, instancePath, refs, {
      type: "ELEMENTS_FORM:NOT_ARRAY",
      actualType: t,
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });

  for (const [i, el] of v.entries()) {
    subValidateFn(el, [...instancePath, "" + i], refs);
  }
}

export type ValidationOptionsForProperties = ValidationOptions & {
  requiredProperties?: Set<string>;
  canHoldAdditionalProperties?: true;
  discriminator?: string;
};
export type PropertyValidateFunctions = Record<
  string,
  InternalValidator["validate"]
>;
export function validateProperties(
  v: any,
  subValidateFns: PropertyValidateFunctions,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptionsForProperties,
) {
  if (opts.isNullable && v === null) return;

  const selfSchemaPath = [
    ...schemaPath,
    (!Object.keys(subValidateFns).length || opts.requiredProperties)
      ? "properties"
      : "optionalProperties",
  ];

  const t = jsonTypeOf(v);
  if (t !== "object") {
    pushError(selfSchemaPath, instancePath, refs, {
      type: "PROPERTIES_FORM:NOT_OBJECT",
      actualType: t,
    });
    return;
  }
  const seenRequired = new Set<string>();
  const unexpectedAdditionalPropertyKeys: string[] = [];
  const subsToRun: (() => void)[] = [];
  for (const [key, value] of Object.entries(v)) {
    const subFn = subValidateFns[key];
    if (!subFn) {
      if (
        !opts.canHoldAdditionalProperties &&
        (opts.discriminator === undefined || key !== opts.discriminator)
      ) {
        unexpectedAdditionalPropertyKeys.push(key);
      }
      continue;
    }
    const isRequired = opts.requiredProperties?.has(key);
    if (isRequired) {
      seenRequired.add(key);
    }
    subsToRun.push(() => subFn(value, [...instancePath, key], refs));
  }
  if (seenRequired.size < (opts.requiredProperties?.size ?? 0)) {
    const missingKeys = [...opts.requiredProperties!.values()]
      .filter((k) => !seenRequired.has(k));
    for (const key of missingKeys) {
      pushError([...instancePath, "properties", key], instancePath, refs, {
        type: "PROPERTIES_FORM:MISSING_REQUIRED_PROPERTY",
        key,
      });
    }
  }
  if (unexpectedAdditionalPropertyKeys.length > 0) {
    for (const key of unexpectedAdditionalPropertyKeys) {
      pushError(schemaPath, [...instancePath, key], refs, {
        type: "PROPERTIES_FORM:UNEXPECTED_ADDITIONAL_PROPERTY",
        key,
      });
    }
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });

  for (const subToRun of subsToRun) {
    subToRun();
  }
}

export function validateValues(
  v: any,
  subValidateFn: InternalValidator["validate"],
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "object") {
    pushError(schemaPath, instancePath, refs, {
      type: "VALUES_FORM:NOT_OBJECT",
      actualType: t,
    });
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });

  for (const [key, value] of Object.entries(v)) {
    subValidateFn(value, [...instancePath, key], refs);
  }
}

export type MappingValidateFunctions = Record<
  string,
  InternalValidator["validate"]
>;
export function validateDiscriminator(
  v: any,
  discriminator: string,
  subValidateFns: MappingValidateFunctions,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;
  const t = jsonTypeOf(v);
  if (t !== "object") {
    pushError([...schemaPath, "discriminator"], instancePath, refs, {
      type: "DISCRIMINATOR_FORM:NOT_OBJECT",
      actualType: t,
    });
    return;
  }

  if (!(discriminator in v)) {
    pushError([...schemaPath, "discriminator"], instancePath, refs, {
      type: "DISCRIMINATOR_FORM:MISSING_DISCRIMINATOR",
      discriminator,
    });
    return;
  }
  const discriminatorValue = v[discriminator];
  const tDiscriminator = jsonTypeOf(discriminatorValue);
  if (tDiscriminator !== "string") {
    pushError(
      [...schemaPath, "discriminator"],
      [...instancePath, discriminator],
      refs,
      {
        type: "DISCRIMINATOR_FORM:DISCRIMINATOR_VALUE_NOT_STRING",
        actualType: tDiscriminator,
      },
    );
    return;
  }

  const subFn = subValidateFns[discriminatorValue];
  if (!subFn) {
    pushError(
      [...schemaPath, "mapping"],
      [...instancePath, discriminator],
      refs,
      {
        type: "DISCRIMINATOR_FORM:INVALID_DISCRIMINATOR_VALUE",
        actualDiscriminatorValue: discriminatorValue,
      },
    );
    return;
  }

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });

  subFn(v, instancePath, refs);
}

export function validateRef(
  v: any,
  subValidateFnGetter: () => InternalValidator["validate"] | null,
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  opts: ValidationOptions,
) {
  if (opts.isNullable && v === null) return;

  opts.supplementalValidateFunctions &&
    runSupplementalValidateFunctions(opts.supplementalValidateFunctions, v, {
      pushError: (raw) => pushError(schemaPath, instancePath, refs, raw),
    });

  const subValidateFn = subValidateFnGetter();
  subValidateFn!(v, instancePath, refs);
}

function pushError(
  schemaPath: string[],
  instancePath: string[],
  refs: ValidationReferences,
  raw: ValidationRawError,
) {
  const err: ValidationError = {
    raw,
    instancePath,
    schemaPath,
  };
  refs.errors.push(err);
}

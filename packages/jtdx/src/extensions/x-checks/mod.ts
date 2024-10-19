/**
 * @module
 *
 * TODO: use `isDryRun` for optimization.
 *
 * FIXME: How to check leap seconds' boundaries? Or make this extension
 * dependent on extension `(disallow leap seconds)` to make it clear that leap
 * seconds are not supported here?
 *
 * TODO: during compilation, reject checks that are impossible to satisfy on
 * validation, such as:
 * - `{ type: "int8", "x:checks": { minimum: 8, maximum: 10, multipleOf: 6 } }`.
 *    (multiple of 6 cannot be in range [8, 10].)
 * - `{ properties: { foo: {} }, "x:checks": { minProperties: 2 } }`.
 *    (the object can and can only have 1 property, which alway violates the
 *    check.)
 */

import { ExtensionContext } from "../../compiling/extension-context";
import {
  HookOptions,
  SupplementalValidateFunction,
} from "../../compiling/hooks";
import { RANGES } from "../../consts";
import { CompilationRawError } from "../../errors";
import {
  ElementsSchema,
  PropertiesSchema,
  Schema,
  TypeSchema,
  ValuesSchema,
} from "../../types";
import isRFC3339 from "../../utils/isRFC3339";
import { jsonTypeOf } from "../../utils/jsonTypeOf";
import { CET, VET } from "./errors";
import {
  isBoundableType,
  isIntegerType,
  isNonNegativeInteger,
  isNumericType,
  take,
  tryNewRegExp,
} from "./utils";

export function useXChecks(ctx: ExtensionContext) {
  ctx.declareProperty("x:checks");

  for (const which of ["empty", "enum", "discriminator", "ref"] as const) {
    ctx.hooksBuilder.check(which, (schema: Schema, opts: HookOptions) => {
      const xChecksObject = tryExtractXChecksObject(schema, opts);
      if (!xChecksObject) return;
      pushErrorIfHasSurplusProperties(xChecksObject, opts);
    });
  }

  ctx.hooksBuilder
    .check("type", checkTypeSchema)
    .check("elements", checkElementsSchema)
    .check("properties", checkPropertiesSchema)
    .check("values", checkValuesSchema);
}

function checkTypeSchema(schema: TypeSchema, opts: HookOptions) {
  const xChecksObject = tryExtractXChecksObject(schema, opts);
  if (!xChecksObject) return;

  const fns: SupplementalValidateFunction[] = [];

  { // string related:
    checkThatTargetIsInBound(xChecksObject, fns, {
      comparisonTargetType: "string_length",
      min: { key: "minLength" },
      max: { key: "maxLength" },
      shouldBoundsBeNonNegativeIntegers: true,
      extractTarget: (v) => v.length,
      processBound: (_, opts) => {
        if (schema.type !== "string") {
          opts.pushError({
            type: CET.TYPE_FORM.LENGTH_ON_NON_STRING,
            actualType: schema.type,
          });
          return false;
        }
        return null;
      },
      pushError: opts.pushError,
    });

    if ("pattern" in xChecksObject) {
      const pattern = take(xChecksObject, "pattern")!;
      if (schema.type !== "string") {
        opts.pushError({
          type: CET.TYPE_FORM.PATTERN_ON_NON_STRING,
          actualType: schema.type,
        });
      } else if (typeof pattern !== "string") {
        opts.pushError({
          type: CET.TYPE_FORM.NON_STRING_PATTERN,
          patternType: jsonTypeOf(pattern),
        });
      } else {
        const rxOrErr = tryNewRegExp(pattern);
        if (rxOrErr instanceof Error) {
          opts.pushError({
            type: CET.TYPE_FORM.INVALID_PATTERN,
            errorMessage: rxOrErr.message,
          });
        } else {
          fns.push((v: string, opts) => {
            if (!rxOrErr.test(v)) {
              opts.pushError({ type: VET.PATTERN_MISMATCH, pattern });
            }
          });
        }
      }
    }
  }

  { // boundable related:
    checkThatTargetIsInBound(xChecksObject, fns, {
      comparisonTargetType: "value",
      min: { key: "minimum", exclusiveKey: "exclusiveMinimum" },
      max: { key: "maximum", exclusiveKey: "exclusiveMaximum" },
      shouldBoundsBeNonNegativeIntegers: false,
      extractTarget: schema.type === "timestamp"
        ? (v) => new Date(v).getTime()
        : (v) => v,
      processBound: (bound, opts) => {
        if (!isBoundableType(schema.type)) {
          opts.pushError({
            type: CET.TYPE_FORM.BOUND_ON_NON_BOUNDABLE,
            boundSide: opts.boundSide,
            actualType: schema.type,
          });
          return false;
        }
        if (schema.type === "timestamp") {
          if (typeof bound !== "string") {
            opts.pushError({
              type: CET.TYPE_FORM.NON_STRING_BOUND_ON_TIMESTAMP,
              boundSide: opts.boundSide,
              actualBoundType: jsonTypeOf(bound),
            });
            return false;
          } else if (!isRFC3339(bound)) {
            opts.pushError({
              type: CET.TYPE_FORM.NON_RFC3339_BOUND_ON_TIMESTAMP,
              boundSide: opts.boundSide,
            });
            return false;
          }
          return new Date(bound).getTime();
        } else {
          if (typeof bound !== "number") {
            // let the internal logic of `checkThatTargetIsInBound` handle it.
            return bound as number;
          }

          let isOk = true;
          if (isIntegerType(schema.type)) {
            if (!Number.isInteger(bound)) {
              isOk = false;
              opts.pushError({
                type: CET.TYPE_FORM.NON_INTEGER_BOUND_ON_INTEGER,
                boundSide: opts.boundSide,
              });
            }

            const range = RANGES[schema.type];
            if (bound < range[0] || bound > range[1]) {
              isOk = false;
              opts.pushError({
                type: CET.TYPE_FORM.BOUND_OUT_OF_RANGE,
                boundSide: opts.boundSide,
                typeType: schema.type,
              });
            }
          }

          return isOk ? bound : false;
        }
      },
      pushError: opts.pushError,
    });
  }

  { // numeric related:
    if ("multipleOf" in xChecksObject) {
      const multipleOf = take(xChecksObject, "multipleOf")!;
      if (!isNumericType(schema.type)) {
        opts.pushError({ type: CET.TYPE_FORM.MULTIPLE_OF_ON_NON_NUMERIC });
      } else if (!isIntegerType(schema.type)) {
        // TODO: figure out how to handle rounding issues to support non-integer
        // numbers.
        opts.pushError({
          type: CET.TYPE_FORM.MULTIPLE_OF_ON_NON_INTEGER_NUMERIC_NOT_SUPPORTED,
        });
      } else if (typeof multipleOf !== "number") {
        opts.pushError({ type: CET.TYPE_FORM.NON_NUMERIC_MULTIPLE_OF });
      } else if (!Number.isInteger(multipleOf)) {
        // TODO: same as above. (rounding issues)
        opts.pushError({
          type: CET.TYPE_FORM.NON_INTEGER_MULTIPLE_OF_NOT_SUPPORTED,
        });
      } else {
        fns.push((v: number, opts) => {
          if (v % multipleOf !== 0) {
            opts.pushError({ type: VET.NOT_MULTIPLE_OF, multipleOf });
          }
        });
      }
    }
  }

  pushErrorIfHasSurplusProperties(xChecksObject, opts);

  return fns;
}

function checkElementsSchema(schema: ElementsSchema, opts: HookOptions) {
  const xChecksObject = tryExtractXChecksObject(schema, opts);
  if (!xChecksObject) return;

  const fns: SupplementalValidateFunction[] = [];

  checkThatTargetIsInBound(xChecksObject, fns, {
    comparisonTargetType: "elements",
    min: { key: "minElements" },
    max: { key: "maxElements" },
    shouldBoundsBeNonNegativeIntegers: true,
    extractTarget: (v) => v.length,
    pushError: opts.pushError,
  });

  if ("uniqueElements" in xChecksObject) {
    const uniqueElements = take(xChecksObject, "uniqueElements")!;
    if (uniqueElements) {
      fns.push((v: any[], opts) => {
        if (v.length !== new Set(v).size) {
          opts.pushError({ type: VET.ELEMENTS_NOT_UNIQUE });
        }
      });
    }
  }

  pushErrorIfHasSurplusProperties(xChecksObject, opts);

  return fns;
}

function checkPropertiesSchema(schema: PropertiesSchema, opts: HookOptions) {
  const xChecksObject = tryExtractXChecksObject(schema, opts);
  if (!xChecksObject) return;

  const fns: SupplementalValidateFunction[] = [];

  checkThatTargetIsInBound(xChecksObject, fns, {
    comparisonTargetType: "properties",
    min: { key: "minProperties" },
    max: { key: "maxProperties" },
    shouldBoundsBeNonNegativeIntegers: true,
    extractTarget: (v) => Object.keys(v).length,
    pushError: opts.pushError,
  });

  pushErrorIfHasSurplusProperties(xChecksObject, opts);

  return fns;
}

function checkValuesSchema(schema: ValuesSchema, opts: HookOptions) {
  const xChecksObject = tryExtractXChecksObject(schema, opts);
  if (!xChecksObject) return;

  const fns: SupplementalValidateFunction[] = [];

  checkThatTargetIsInBound(xChecksObject, fns, {
    comparisonTargetType: "values",
    min: { key: "minValues" },
    max: { key: "maxValues" },
    shouldBoundsBeNonNegativeIntegers: true,
    extractTarget: (v) => Object.keys(v).length,
    pushError: opts.pushError,
  });

  pushErrorIfHasSurplusProperties(xChecksObject, opts);

  return fns;
}

export type ComparisonTargetType =
  | "string_length"
  | "value"
  | "elements"
  | "properties"
  | "values";

function checkThatTargetIsInBound(
  xChecksObject: any, // I surrender.
  fns: SupplementalValidateFunction[],
  opts: {
    comparisonTargetType: ComparisonTargetType;
    min: { key: string; exclusiveKey?: string };
    max: { key: string; exclusiveKey?: string };
    shouldBoundsBeNonNegativeIntegers: boolean;
    extractTarget: (v: any) => number;

    processBound?: BoundProcessor;

    pushError: (raw: CompilationRawError) => void;
  },
) {
  const { comparisonTargetType, extractTarget } = opts;

  const baseExtractBoundOpts = {
    shouldBeNonNegativeInteger: opts.shouldBoundsBeNonNegativeIntegers,
    processBound: opts.processBound,
    pushError: opts.pushError,
  };

  const {
    bound: min,
    isExclusive: isMinExclusive,
  } = extractBound(xChecksObject, {
    comparisonTargetType,
    side: "min",
    ...baseExtractBoundOpts,
    ...opts.min,
  });
  const {
    bound: max,
    isExclusive: isMaxExclusive,
  } = extractBound(xChecksObject, {
    comparisonTargetType,
    side: "max",
    ...baseExtractBoundOpts,
    ...opts.max,
  });

  if (min !== null && max !== null) {
    if (min > max) {
      opts.pushError({
        type: CET.BOUND.MIN_GREATER_THAN_MAX,
        comparisonTargetType,
      });
    } else if ((isMinExclusive || isMaxExclusive) && min === max) {
      opts.pushError({
        type: CET.BOUND.MIN_EQUAL_TO_MAX_WHILE_EXCLUSIVE,
        comparisonTargetType,
      });
    }
  }

  if (min !== null) {
    if (isMinExclusive) {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) <= min) {
          opts.pushError({
            type: VET.OUT_OF_BOUND,
            comparisonTargetType,
            bound: min,
            targetBeingWhatThanBound: "<=",
          });
        }
      });
    } else {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) < min) {
          opts.pushError({
            type: VET.OUT_OF_BOUND,
            comparisonTargetType,
            bound: min,
            targetBeingWhatThanBound: "<",
          });
        }
      });
    }
  }
  if (max !== null) {
    if (isMaxExclusive) {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) >= max) {
          opts.pushError({
            type: VET.OUT_OF_BOUND,
            comparisonTargetType,
            bound: max,
            targetBeingWhatThanBound: ">=",
          });
        }
      });
    } else {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) > max) {
          opts.pushError({
            type: VET.OUT_OF_BOUND,
            comparisonTargetType,
            bound: max,
            targetBeingWhatThanBound: ">",
          });
        }
      });
    }
  }
}

/**
 * @returns `number` if `minOrMax` needs to be transformed, `false` if
 * something is wrong, `null` if nothing is needed.
 */
type BoundProcessor = (
  bound: any,
  opts: {
    boundSide: "min" | "max";
    pushError: (raw: CompilationRawError) => void;
  },
) => number | false | null;

const NULL_BOUND = { bound: null, isExclusive: false };

function extractBound(xChecksObject: any, opts: {
  comparisonTargetType: ComparisonTargetType;
  side: "min" | "max";
  key: string;
  exclusiveKey?: string;
  shouldBeNonNegativeInteger: boolean;

  processBound?: BoundProcessor;

  pushError: (raw: CompilationRawError) => void;
}): { bound: number | null; isExclusive: boolean } {
  let key: string;
  let isExclusive = false;
  if (opts.exclusiveKey && opts.exclusiveKey in xChecksObject) {
    if (opts.key in xChecksObject) {
      opts.pushError({
        type: CET.BOUND.BOTH_EXCLUSIVE_AND_INCLUSIVE,
        comparisonTargetType: opts.comparisonTargetType,
        boundSide: opts.side,
      });
      delete xChecksObject[opts.key];
    }
    key = opts.exclusiveKey;
    isExclusive = true;
  } else if (opts.key in xChecksObject) {
    key = opts.key;
  } else return NULL_BOUND;

  const bound__ = take(xChecksObject, key)!;
  const bound_ = opts.processBound?.(bound__, {
    boundSide: opts.side,
    pushError: opts.pushError,
  }) ?? null;
  if (bound_ === false) return NULL_BOUND;
  const bound = bound_ ?? bound__;

  if (typeof bound !== "number") {
    opts.pushError({
      type: CET.BOUND.NON_NUMERIC_BOUND,
      comparisonTargetType: opts.comparisonTargetType,
      boundSide: opts.side,
      actualBoundType: jsonTypeOf(bound),
    });
    return NULL_BOUND;
  } else if (opts.shouldBeNonNegativeInteger && !isNonNegativeInteger(bound)) {
    opts.pushError({
      type: CET.BOUND.NEGATIVE_OR_NON_INTEGER_BOUND_NOT_ALLOWED,
      comparisonTargetType: opts.comparisonTargetType,
      boundSide: opts.side,
    });
    return NULL_BOUND;
  }

  return { bound, isExclusive };
}

function tryExtractXChecksObject<T extends Schema>(
  schema: T,
  opts: { pushError: (raw: CompilationRawError) => void },
): (T extends { "x:checks"?: infer U } ? U : never) | null {
  if (!("x:checks" in schema)) return null;

  const t = jsonTypeOf(schema["x:checks"]);
  if (t !== "object") {
    opts.pushError({ type: CET.X_OBJECT.NOT_OBJECT });
    return null;
  }

  // @ts-ignore
  return structuredClone(schema["x:checks"]!);
}

function pushErrorIfHasSurplusProperties(
  xChecksObject: Object,
  opts: { pushError: (raw: CompilationRawError) => void },
) {
  const keys = Object.keys(xChecksObject);
  if (!keys.length) return;

  opts.pushError({ type: CET.X_OBJECT.SURPLUS_PROPERTIES, keys });
}

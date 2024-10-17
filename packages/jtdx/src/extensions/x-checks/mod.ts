/**
 * @module
 * TODO: use `isDryRun` for optimization.
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
      min: { key: "minLength" },
      max: { key: "maxLength" },
      shouldBoundsBeNonNegativeIntegers: true,
      extractTarget: (v) => v.length,
      processBound: (_, opts) => {
        if (schema.type === "string") return null;
        opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
        return false;
      },
      pushError: opts.pushError,
    });

    if ("pattern" in xChecksObject) {
      const pattern = take(xChecksObject, "pattern")!;
      if (schema.type !== "string") {
        opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
      } else if (typeof pattern !== "string") {
        opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
      } else {
        const rxOrErr = tryNewRegExp(pattern);
        if (rxOrErr instanceof Error) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
        } else {
          fns.push((v: string, opts) => {
            if (!rxOrErr.test(v)) {
              opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
            }
          });
        }
      }
    }
  }

  { // boundable related:
    checkThatTargetIsInBound(xChecksObject, fns, {
      min: { key: "minimum", exclusiveKey: "exclusiveMinimum" },
      max: { key: "maximum", exclusiveKey: "exclusiveMaximum" },
      shouldBoundsBeNonNegativeIntegers: false,
      extractTarget: schema.type === "timestamp"
        ? (v) => new Date(v).getTime()
        : (v) => v,
      processBound: (bound, opts) => {
        if (!isBoundableType(schema.type)) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
          return false;
        }
        if (schema.type === "timestamp") {
          if (typeof bound !== "string") {
            opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
            return false;
          } else if (!isRFC3339(bound)) {
            opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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
              opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
            }

            const range = RANGES[schema.type];
            if (bound < range[0] || bound > range[1]) {
              isOk = false;
              opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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
        opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
      } else if (typeof multipleOf !== "number") {
        opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
      } else {
        fns.push((v: number, opts) => {
          if (v % multipleOf !== 0) {
            opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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
    min: { key: "minItems" },
    max: { key: "maxItems" },
    shouldBoundsBeNonNegativeIntegers: true,
    extractTarget: (v) => v.length,
    pushError: opts.pushError,
  });

  if ("uniqueItems" in xChecksObject) {
    const uniqueItems = take(xChecksObject, "uniqueItems")!;
    if (uniqueItems) {
      fns.push((v: any[], opts) => {
        if (v.length !== new Set(v).size) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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
    min: { key: "minValues" },
    max: { key: "maxValues" },
    shouldBoundsBeNonNegativeIntegers: true,
    extractTarget: (v) => Object.keys(v).length,
    pushError: opts.pushError,
  });

  pushErrorIfHasSurplusProperties(xChecksObject, opts);

  return fns;
}

function checkThatTargetIsInBound(
  xChecksObject: any, // I surrender.
  fns: SupplementalValidateFunction[],
  opts: {
    min: { key: string; exclusiveKey?: string };
    max: { key: string; exclusiveKey?: string };
    shouldBoundsBeNonNegativeIntegers: boolean;
    extractTarget: (v: any) => number;

    processBound?: BoundProcessor;

    pushError: (raw: CompilationRawError) => void;
  },
) {
  const { extractTarget } = opts;

  const baseExtractBoundOpts = {
    shouldBeNonNegativeInteger: opts.shouldBoundsBeNonNegativeIntegers,
    processBound: opts.processBound,
    pushError: opts.pushError,
  };

  const {
    bound: min,
    isExclusive: isMinExclusive,
  } = extractBound(xChecksObject, { ...baseExtractBoundOpts, ...opts.min });
  const {
    bound: max,
    isExclusive: isMaxExclusive,
  } = extractBound(xChecksObject, { ...baseExtractBoundOpts, ...opts.max });

  if (min !== null && max !== null) {
    if (min > max) {
      opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
    } else if (isMinExclusive && isMaxExclusive && min === max) {
      opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
    }
  }

  if (min !== null) {
    if (isMinExclusive) {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) <= min) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
        }
      });
    } else {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) < min) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
        }
      });
    }
  }
  if (max !== null) {
    if (isMaxExclusive) {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) >= max) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
        }
      });
    } else {
      fns.push((v: any[], opts) => {
        if (extractTarget(v) > max) {
          opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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
  opts: { pushError: (raw: CompilationRawError) => void },
) => number | false | null;

const NULL_BOUND = { bound: null, isExclusive: false };

function extractBound(xChecksObject: any, opts: {
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
      opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
    }
    key = opts.exclusiveKey;
    isExclusive = true;
  } else if (opts.key in xChecksObject) {
    key = opts.key;
  } else return NULL_BOUND;

  const bound__ = take(xChecksObject, key)!;
  const bound_ = opts.processBound?.(bound__, opts) ?? null;
  if (bound__ === false) return NULL_BOUND;
  const bound = bound_ ?? bound__;

  if (typeof bound !== "number") {
    opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
    return NULL_BOUND;
  } else if (opts.shouldBeNonNegativeInteger && !isNonNegativeInteger(bound)) {
    opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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
    opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
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

  opts.pushError({ type: "EXTENSION:X_CHECKS:TODO" });
}

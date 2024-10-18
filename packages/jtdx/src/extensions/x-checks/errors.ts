import { ComparisonTargetType } from "./mod";

export const ERROR_PREFIX = "EXTENSION:X_CHECKS" as const;

/**
 * CET = Compilation Error Types.
 */
export const CET = {
  TODO: `${ERROR_PREFIX}:TODO`,
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
 * For extension `breaking/x:checks`.
 */
export type CompilationRawErrorByExtensionXChecks =
  | { type: typeof CET.TODO }
  | never;

/**
 * For extension `breaking/x:checks`.
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

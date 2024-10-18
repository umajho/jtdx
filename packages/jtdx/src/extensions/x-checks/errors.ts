import { ComparisonTargetType } from "./mod";

export const ERROR_PREFIX = "EXTENSION:X_CHECKS" as const;

export const COMPILATION_ERROR_TYPES = {
  TODO: `${ERROR_PREFIX}:TODO`,
} as const;

export const VALIDATION_ERROR_TYPES = {
  PATTERN_MISMATCH: `${ERROR_PREFIX}:PATTERN_MISMATCH`,
  NOT_MULTIPLE_OF: `${ERROR_PREFIX}:NOT_MULTIPLE_OF`,
  ELEMENTS_NOT_UNIQUE: `${ERROR_PREFIX}:ELEMENTS_NOT_UNIQUE`,
  OUT_OF_BOUND: `${ERROR_PREFIX}:OUT_OF_BOUND`,
} as const;

/**
 * For extension `breaking/x:checks`.
 */
export type CompilationRawErrorByExtensionXChecks =
  | { type: typeof COMPILATION_ERROR_TYPES.TODO }
  | never;

/**
 * For extension `breaking/x:checks`.
 *
 * TODO: see TODO of `ValidationRawError`.
 */
export type ValidationRawErrorByExtensionXChecks =
  | { type: typeof VALIDATION_ERROR_TYPES.PATTERN_MISMATCH; pattern: string }
  | { type: typeof VALIDATION_ERROR_TYPES.NOT_MULTIPLE_OF; multipleOf: number }
  | { type: typeof VALIDATION_ERROR_TYPES.ELEMENTS_NOT_UNIQUE }
  | {
    type: typeof VALIDATION_ERROR_TYPES.OUT_OF_BOUND;
    comparisonTargetType: ComparisonTargetType;
    bound: number;
    targetBeingWhatThanBound: "<" | ">" | "<=" | ">=";
  };

const ERROR_PREFIX = "EXTENSION:X_CHECKS" as const;

export const COMPILATION_ERROR_TYPES = {
  TODO: `${ERROR_PREFIX}:TODO`,
} as const;

export const VALIDATION_ERROR_TYPES = {
  TODO: `${ERROR_PREFIX}:TODO`,
} as const;

/**
 * For extension `breaking/x:checks`.
 */
export type CompilationRawErrorByExtensionXChecks =
  | { type: typeof COMPILATION_ERROR_TYPES.TODO }
  | never;

/**
 * For extension `breaking/x:checks`.
 */
export type ValidationRawErrorByExtensionXChecks =
  | { type: typeof VALIDATION_ERROR_TYPES.TODO }
  | never;

import { ExtensionContext } from "../compiling/extension-context";

export function useDisallowLeapSeconds(ctx: ExtensionContext): void {
  ctx.hooksBuilder.check("type", (schema, _opts) => {
    if (schema.type === "timestamp") {
      return (v: string, opts) => {
        // "2006-01-02T15:04:05Z"
        //  01234567890123456^
        if (v.slice(17, 19) === "60") {
          opts.pushError({
            type: VALIDATION_ERROR_TYPES.LEAP_SECONDS_NOT_ALLOWED_ON_TIMESTAMP,
          });
        }
      };
    }

    return;
  });
}

const ERROR_PREFIX = "EXTENSION:DISALLOW_LEAP_SECONDS" as const;

const VALIDATION_ERROR_TYPES = {
  LEAP_SECONDS_NOT_ALLOWED_ON_TIMESTAMP:
    `${ERROR_PREFIX}:TYPE_FORM:LEAP_SECONDS_NOT_ALLOWED_ON_TIMESTAMP`,
} as const;

/**
 * For breaking extension `(disallow leap seconds)`.
 */
export type ValidationRawErrorByExtensionDisallowLeapSeconds =
  | {
    type: typeof VALIDATION_ERROR_TYPES.LEAP_SECONDS_NOT_ALLOWED_ON_TIMESTAMP;
  }
  | never;

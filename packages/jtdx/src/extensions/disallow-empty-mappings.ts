import { ExtensionContext } from "../compiling/extension-context";

export function useDisallowEmptyMappings(ctx: ExtensionContext): void {
  ctx.hooksBuilder.check("discriminator", (schema, opts) => {
    if (Object.keys(schema.mapping).length === 0) {
      opts.pushError({ type: COMPILATION_ERROR_TYPES.EMPTY_MAPPING });
    }
  });
}

const ERROR_PREFIX = "EXTENSION:DISALLOW_EMPTY_MAPPINGS" as const;

const COMPILATION_ERROR_TYPES = {
  EMPTY_MAPPING: `${ERROR_PREFIX}:DISCRIMINATOR_FORM:EMPTY_MAPPING`,
} as const;

/**
 * For extension `breaking/(disallow empty mappings)`.
 */
export type CompilationRawErrorByExtensionDisallowEmptyMappings =
  // e.g. `{ "discriminator": "foo", "mapping": {} }`.
  | { type: typeof COMPILATION_ERROR_TYPES.EMPTY_MAPPING }
  | never;

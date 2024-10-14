import { HooksBuilder } from "../compiling/hooks";

export function useDisallowEmptyMappings(builder: HooksBuilder): void {
  builder.check("discriminator", (schema, opts) => {
    if (Object.keys(schema.mapping).length === 0) {
      opts.pushError({ type: "DISCRIMINATOR_FORM:EMPTY_MAPPING" });
    }
  });
}

import { HooksBUilder } from "../compiling/hooks";

export function useDisallowEmptyMappings(builder: HooksBUilder): void {
  builder.check("discriminator", (schema, opts) => {
    if (Object.keys(schema.mapping).length === 0) {
      opts.pushError({ type: "DISCRIMINATOR_FORM:EMPTY_MAPPING" });
    }
  });
}

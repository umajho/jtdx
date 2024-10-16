import { createHooksBuilder, Hooks } from "./hooks";

export interface FinalizedExtensionContext {
  additionalPropertyNames: Set<string>;
  hooks: Hooks;
}

export type ExtensionContext = //
  ReturnType<typeof createExtensionContext>["context"];

export function createExtensionContext() {
  const additionalPropertyNames = new Set<string>();
  const { builder: hooksBuilder, build: buildHooks } = createHooksBuilder();

  const context = {
    declareProperty(name: string) {
      additionalPropertyNames.add(name);
    },
    get hooksBuilder() {
      return hooksBuilder;
    },
  };

  function finalize(): FinalizedExtensionContext {
    return {
      additionalPropertyNames,
      hooks: buildHooks(),
    };
  }

  return {
    context,
    finalize,
  };
}

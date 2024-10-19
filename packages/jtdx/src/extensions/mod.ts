import { ExtensionContext } from "../compiling/extension-context";

import { useDisallowEmptyMappings } from "./disallow-empty-mappings";
import { useDisallowLeapSeconds } from "./disallow-leap-seconds";
import { useXChecks } from "./x-checks/mod";

export const breakingExtensionDisallowEmptyMappings = {
  __unstable__: useDisallowEmptyMappings,
} as BreakingExtension;

export const breakingExtensionDisallowLeapSeconds = {
  __unstable__: useDisallowLeapSeconds,
} as BreakingExtension;

export const breakingExtensionXChecks = {
  __unstable__: useXChecks,
} as BreakingExtension;

export type BreakingExtension =
  & { __unstable__: (ctx: ExtensionContext) => void }
  & { readonly __tag: unique symbol };

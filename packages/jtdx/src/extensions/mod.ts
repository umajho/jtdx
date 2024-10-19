import { ExtensionContext } from "../compiling/extension-context";
import { internal } from "../internal/mod";

import { useDisallowEmptyMappings } from "./disallow-empty-mappings";
import { useDisallowLeapSeconds } from "./disallow-leap-seconds";
import { useXChecks } from "./x-checks/mod";

export const breakingExtensionDisallowEmptyMappings: BreakingExtension = {
  [internal]: useDisallowEmptyMappings,
};

export const breakingExtensionDisallowLeapSeconds: BreakingExtension = {
  [internal]: useDisallowLeapSeconds,
};

export const breakingExtensionXChecks: BreakingExtension = {
  [internal]: useXChecks,
} as BreakingExtension;

export type BreakingExtension =
  | { [internal]: (ctx: ExtensionContext) => void }
  | { readonly __tag: unique symbol };
